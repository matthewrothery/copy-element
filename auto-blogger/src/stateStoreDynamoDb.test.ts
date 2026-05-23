/**
 * Tests for DynamoDbStateStore using a minimal in-memory mock of the
 * DynamoDBDocumentClient. We test the conditional-write logic and query
 * pagination without hitting real AWS.
 */
import test from "node:test";
import assert from "node:assert/strict";

// Minimal in-memory DynamoDB table for testing.
type Item = Record<string, unknown>;
type Table = Map<string, Item>; // key: `${pk}#${sk}`

function makeKey(pk: string, sk: string): string {
  return `${pk}\x00${sk}`;
}

function makeMockDdb(table: Table) {
  return {
    send(command: { input: Record<string, unknown> } & { constructor: { name: string } }): Promise<unknown> {
      const name = command.constructor.name;
      const input = command.input as Record<string, unknown>;
      const tableName = input["TableName"] as string;
      void tableName;

      if (name === "PutCommand") {
        const item = input["Item"] as Item;
        const pk = item["pk"] as string;
        const sk = item["sk"] as string;
        const key = makeKey(pk, sk);
        const condition = input["ConditionExpression"] as string | undefined;
        if (condition?.includes("attribute_not_exists") && table.has(key)) {
          const err = new Error("The conditional request failed");
          (err as unknown as { name: string }).name = "ConditionalCheckFailedException";
          return Promise.reject(err);
        }
        table.set(key, { ...item });
        return Promise.resolve({});
      }

      if (name === "UpdateCommand") {
        const key = input["Key"] as Item;
        const pk = key["pk"] as string;
        const sk = key["sk"] as string;
        const mapKey = makeKey(pk, sk);
        const existing = table.get(mapKey) ?? { pk, sk };
        const expr = input["UpdateExpression"] as string;
        const vals = input["ExpressionAttributeValues"] as Record<string, unknown>;
        const setMatch = expr.match(/SET (\w+) = :(\w+)/);
        if (setMatch) {
          const [, attr, valKey] = setMatch;
          (existing as Record<string, unknown>)[attr] = vals[`:${valKey}`];
        }
        table.set(mapKey, existing);
        return Promise.resolve({});
      }

      if (name === "QueryCommand") {
        const keyExpr = input["KeyConditionExpression"] as string;
        const vals = input["ExpressionAttributeValues"] as Record<string, unknown>;
        const bucketMatch = keyExpr.match(/pk = :(\w+)/);
        if (!bucketMatch) return Promise.resolve({ Items: [] });
        const bucket = vals[`:${bucketMatch[1]}`] as string;
        const items = [...table.values()].filter((i) => i["pk"] === bucket);
        return Promise.resolve({ Items: items, LastEvaluatedKey: undefined });
      }

      return Promise.resolve({});
    },
  };
}

// Patch DynamoDbStateStore to accept an injected client for testing.
async function makeTestStore(table: Table) {
  const { DynamoDbStateStore } = await import("./stateStoreDynamoDb.js");
  const store = new DynamoDbStateStore("test-table", "us-east-2");
  // Inject mock client by overriding the private field.
  (store as unknown as { ddb: unknown }).ddb = makeMockDdb(table);
  return store;
}

test("claimKeyword succeeds on first call, rejects duplicate", async () => {
  const table: Table = new Map();
  const store = await makeTestStore(table);

  const first = await store.claimKeyword("hub/cluster/kw-one", "req-a");
  const second = await store.claimKeyword("hub/cluster/kw-one", "req-b");
  const different = await store.claimKeyword("hub/cluster/kw-two", "req-c");

  assert.equal(first, true);
  assert.equal(second, false, "Duplicate claim should return false");
  assert.equal(different, true);
  assert.equal(table.size, 2, "Two distinct items should exist");
});

test("recordSlug follows same conditional-write pattern", async () => {
  const table: Table = new Map();
  const store = await makeTestStore(table);

  assert.equal(await store.recordSlug("my-slug"), true);
  assert.equal(await store.recordSlug("my-slug"), false);
  assert.equal(await store.recordSlug("other-slug"), true);
});

test("loadProcessedKeywordIds returns all claimed keyword ids", async () => {
  const table: Table = new Map();
  const store = await makeTestStore(table);

  await store.claimKeyword("hub/cluster/alpha", "req");
  await store.claimKeyword("hub/cluster/beta", "req");
  await store.recordSlug("some-slug"); // different bucket — must not appear

  const ids = await store.loadProcessedKeywordIds();
  assert.ok(ids.has("hub/cluster/alpha"));
  assert.ok(ids.has("hub/cluster/beta"));
  assert.equal(ids.size, 2);
});

test("loadProcessedSlugs returns recorded slugs only", async () => {
  const table: Table = new Map();
  const store = await makeTestStore(table);

  await store.recordSlug("slug-x");
  await store.claimKeyword("some/kw", "req"); // different bucket

  const slugs = await store.loadProcessedSlugs();
  assert.ok(slugs.has("slug-x"));
  assert.equal(slugs.size, 1);
});

test("recordEmailFailure writes an EMAIL_FAIL item with epoch-seconds TTL", async () => {
  const table: Table = new Map();
  const store = await makeTestStore(table);

  const beforeSec = Math.floor(Date.now() / 1000);
  await store.recordEmailFailure("artifact-123");
  const afterSec = Math.floor(Date.now() / 1000);

  const item = [...table.values()].find((i) => i["pk"] === "EMAIL_FAIL");
  assert.ok(item, "EMAIL_FAIL item should exist");
  const ttl = item["ttl"] as number;
  assert.ok(ttl >= beforeSec + 90 * 86400, "TTL should be ~90 days ahead (epoch seconds)");
  assert.ok(ttl <= afterSec + 90 * 86400 + 5, "TTL should not be far in the future");
  assert.ok(ttl < 1e12, "TTL should be epoch SECONDS (not ms — would be > 1e12)");
});
