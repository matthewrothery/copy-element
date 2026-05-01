import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { ArticleArtifact } from "./types.js";

function getClient(): S3Client {
  return new S3Client({ region: process.env.AWS_REGION ?? process.env.AWS_SES_REGION ?? "us-east-2" });
}

function pendingPrefix(basePrefix: string, artifactId: string): string {
  return `${basePrefix}/pending/${artifactId}`;
}

export async function uploadArtifactToS3(
  bucket: string,
  basePrefix: string,
  artifact: ArticleArtifact
): Promise<void> {
  const client = getClient();
  const prefix = pendingPrefix(basePrefix, artifact.artifactId);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `${prefix}/article.md`,
      Body: artifact.articleMarkdown,
      ContentType: "text/markdown; charset=utf-8",
    })
  );

  for (const asset of artifact.assetBuffers) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `${prefix}/${asset.s3Name}`,
        Body: asset.buffer,
        ContentType: asset.contentType,
      })
    );
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `${prefix}/metadata.json`,
      Body: JSON.stringify(artifact.metadata, null, 2),
      ContentType: "application/json",
    })
  );

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `${prefix}/research.json`,
      Body: JSON.stringify(artifact.research, null, 2),
      ContentType: "application/json",
    })
  );
}

export async function getArtifactImageSignedUrl(
  bucket: string,
  basePrefix: string,
  artifactId: string,
  imageExt: string
): Promise<string> {
  const client = getClient();
  const key = `${pendingPrefix(basePrefix, artifactId)}/cover.${imageExt}`;
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: 60 * 60 * 24 }
  );
}

async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function listPendingArtifactPrefixes(
  bucket: string,
  basePrefix: string
): Promise<string[]> {
  const client = getClient();
  const prefix = `${basePrefix}/pending/`;
  const out = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: "/",
    })
  );

  return (out.CommonPrefixes ?? [])
    .map((item) => item.Prefix)
    .filter((p): p is string => Boolean(p));
}

export async function readS3Text(bucket: string, key: string): Promise<string> {
  const client = getClient();
  const obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!obj.Body) throw new Error(`Missing object body for ${key}`);
  return streamToString(obj.Body as Readable);
}

export async function readS3Buffer(bucket: string, key: string): Promise<Buffer> {
  const client = getClient();
  const obj = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!obj.Body) throw new Error(`Missing object body for ${key}`);
  return streamToBuffer(obj.Body as Readable);
}

export async function movePrefixToPublished(
  bucket: string,
  basePrefix: string,
  artifactId: string,
  assetS3Names: string[]
): Promise<void> {
  const client = getClient();
  const from = pendingPrefix(basePrefix, artifactId);
  const to = `${basePrefix}/published/${artifactId}`;
  const keys = [`article.md`, `metadata.json`, `research.json`, ...assetS3Names];

  for (const item of keys) {
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${from}/${item}`,
        Key: `${to}/${item}`,
      })
    );
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: `${from}/${item}`,
      })
    );
  }
}
