import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/index.js';

const PRESIGN_EXPIRY_SECONDS = 600; // 10 minutes
const MAX_PUT_SIZE = 10 * 1024 * 1024; // 10 MiB

let clientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!clientInstance) {
    if (!config.S3_REGION || !config.S3_BUCKET_CAPTURES) {
      throw new Error('S3 is not configured: S3_REGION and S3_BUCKET_CAPTURES are required.');
    }
    clientInstance = new S3Client({
      region: config.S3_REGION,
      ...(config.S3_ENDPOINT && { endpoint: config.S3_ENDPOINT }),
      ...(config.S3_FORCE_PATH_STYLE && { forcePathStyle: true }),
    });
  }
  return clientInstance;
}

/**
 * Build object key for a capture asset. Path convention: captures/{install_id}/{unique_id}_{asset_kind}.{ext}
 */
export function buildCaptureObjectKey(
  installId: string,
  uniqueId: string,
  assetKind: 'screenshot' | 'html' | 'stylesheet',
  extension?: string
): string {
  const ext = extension ?? (assetKind === 'screenshot' ? 'png' : assetKind === 'html' ? 'html' : 'css');
  return `captures/${installId}/${uniqueId}_${assetKind}.${ext}`;
}

/**
 * Create a presigned PUT URL for uploading a capture asset. Enforces content-type and size in the signed request.
 */
export async function createPresignedPutUrl(
  objectKey: string,
  contentType: string,
  byteSize: number
): Promise<{ url: string; expiresAt: string }> {
  if (byteSize <= 0 || byteSize > MAX_PUT_SIZE) {
    throw new Error(`Invalid byte size: must be 1–${MAX_PUT_SIZE}`);
  }
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: config.S3_BUCKET_CAPTURES,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: byteSize,
  });
  const url = await getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
  const expiresAt = new Date(Date.now() + PRESIGN_EXPIRY_SECONDS * 1000).toISOString();
  return { url, expiresAt };
}

export const S3_MAX_PUT_SIZE = MAX_PUT_SIZE;
