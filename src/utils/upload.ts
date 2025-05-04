import { s3 } from "bun";

export async function uploadToS3(
  pdf: Uint8Array,
  filename: string,
): Promise<string> {
  const bytes = await s3.write(filename, pdf, {
    type: "application/pdf",
    acl: "public-read",
  });

  if (!bytes) {
    throw new Error("Failed to upload PDF to S3");
  }
  return `${process.env.S3_CDN_URL}/${filename}`;
}
