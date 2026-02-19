import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_FILES = 10;

function getExt(name: string): string {
  const match = name.match(/\.(jpe?g|png)$/i);
  return match ? match[1].toLowerCase() : "jpg";
}

export function generateUploadKey(filename: string): string {
  const ext = getExt(filename);
  const uuid = crypto.randomUUID();
  return `uploads/${uuid}.${ext}`;
}

export function getS3Client(): S3Client | null {
  const region = process.env.AWS_REGION;
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKey?.trim() || !secretKey?.trim()) return null;
  return new S3Client({
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

export async function getPresignedPutUrls(
  files: Array<{ name: string; type?: string }>
): Promise<{ key: string; url: string }[]> {
  if (files.length === 0 || files.length > MAX_FILES) return [];
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  if (!bucket) return [];

  const client = getS3Client();
  if (!client) return [];

  const results: { key: string; url: string; contentType: string }[] = [];
  for (const file of files) {
    const key = generateUploadKey(file.name);
    const contentType = file.type && file.type.trim() ? file.type.trim() : "image/jpeg";
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 300 });
    results.push({ key, url, contentType });
  }
  return results;
}

export { MAX_FILES };
