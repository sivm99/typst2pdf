import { Context } from "hono";
import { PdfOptions, S3Config } from "./types";

export function parsePdfOptions(c: Context): PdfOptions {
  const uploadFlag = c.req.header("x-upload") === "true";
  const filename = c.req.header("x-filename") || `${crypto.randomUUID()}.pdf`;
  const streamFlag = !uploadFlag && c.req.header("x-stream") !== "false";

  return {
    filename,
    uploadToS3: uploadFlag,
    streamResponse: streamFlag,
  };
}

export function parseS3Config(c: Context): S3Config | null {
  const accessKeyId = c.req.header("x-s3-access-key") ?? "";
  const secretAccessKey = c.req.header("x-s3-secret-key") ?? "";
  const endpoint = c.req.header("x-s3-endpoint") ?? "";
  const bucket = c.req.header("x-s3-bucket") ?? "";
  const cdnUrl = c.req.header("x-s3-cdn-url") ?? "";
  const customFilename = c.req.header("x-s3-filename");

  // Return null if any required field is missing
  if (!accessKeyId || !secretAccessKey || !endpoint || !bucket || !cdnUrl) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucket,
    cdnUrl,
  };
}
