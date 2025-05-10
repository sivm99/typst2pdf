import { Context } from "hono";

export type PdfOptions = {
  filename: string;
  uploadToS3: boolean;
  streamResponse: boolean;
  s3Config?: S3Config;
};

export type S3Config = {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  cdnUrl: string;
};

export type ProcessResult = {
  success: boolean;
  message?: string;
  url?: string;
  pdfBuffer?: Uint8Array;
};

export type ContentExtractor = {
  canHandle(contentType: string): boolean;
  extract(c: Context): Promise<Uint8Array | null>;
  getErrorMessage(): string;
};
