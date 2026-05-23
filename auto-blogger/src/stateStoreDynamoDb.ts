import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { StateStore } from "./stateStore.js";

/**
 * DynamoDB-backed StateStore with composite key (pk + sk) for atomic keyword
 * claiming across parallel Lambda pipelines.
 *
 * Table schema:
 *   pk (HASH, String): "KEYWORD" | "SLUG" | "EMAIL_FAIL" | "META"
 *   sk (RANGE, String): keyword id | slug | artifactId | "last_run"
 *   claimedAt (Number): epoch ms (Date.now())
 *   claimedBy (String): Lambda request ID
 *   ttl (Number): epoch SECONDS — EMAIL_FAIL items only (90-day retention).
 *                 NOTE: DynamoDB TTL requires epoch seconds, NOT ms.
 *                 All other timestamps (claimedAt) remain epoch ms per GUD-002.
 */
export class DynamoDbStateStore implements StateStore {
  private readonly ddb: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    region: string
  ) {
    const client = new DynamoDBClient({ region });
    this.ddb = DynamoDBDocumentClient.from(client);
  }

  async claimKeyword(id: string, requestId: string): Promise<boolean> {
    try {
      await this.ddb.send(
        new PutCommand({
          TableName: this.tableName,
          Item: {
            pk: "KEYWORD",
            sk: id,
            claimedAt: Date.now(),
            claimedBy: requestId,
          },
          ConditionExpression:
            "attribute_not_exists(pk) AND attribute_not_exists(sk)",
        })
      );
      return true;
    } catch (err) {
      if (isConditionalCheckFailed(err)) return false;
      throw err;
    }
  }

  async recordSlug(slug: string): Promise<boolean> {
    try {
      await this.ddb.send(
        new PutCommand({
          TableName: this.tableName,
          Item: {
            pk: "SLUG",
            sk: slug,
            claimedAt: Date.now(),
          },
          ConditionExpression:
            "attribute_not_exists(pk) AND attribute_not_exists(sk)",
        })
      );
      return true;
    } catch (err) {
      if (isConditionalCheckFailed(err)) return false;
      throw err;
    }
  }

  async loadProcessedKeywordIds(): Promise<Set<string>> {
    return this.queryBucket("KEYWORD");
  }

  async loadProcessedSlugs(): Promise<Set<string>> {
    return this.queryBucket("SLUG");
  }

  async recordEmailFailure(artifactId: string): Promise<void> {
    const ttlSeconds = Math.floor(Date.now() / 1000) + 90 * 86400;
    await this.ddb.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: "EMAIL_FAIL",
          sk: artifactId,
          claimedAt: Date.now(),
          ttl: ttlSeconds,
        },
      })
    );
  }

  async recordRun(timestamp: number): Promise<void> {
    await this.ddb.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: "META", sk: "last_run" },
        UpdateExpression: "SET claimedAt = :ts",
        ExpressionAttributeValues: { ":ts": timestamp },
      })
    );
  }

  private async queryBucket(bucket: string): Promise<Set<string>> {
    const result = new Set<string>();
    let lastKey: Record<string, unknown> | undefined;
    do {
      const resp = await this.ddb.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: "pk = :b",
          ExpressionAttributeValues: { ":b": bucket },
          ProjectionExpression: "sk",
          ExclusiveStartKey: lastKey,
        })
      );
      for (const item of resp.Items ?? []) {
        if (typeof item["sk"] === "string") result.add(item["sk"] as string);
      }
      lastKey = resp.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastKey);
    return result;
  }
}

function isConditionalCheckFailed(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "ConditionalCheckFailedException"
  );
}
