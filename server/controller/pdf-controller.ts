import { Context } from "hono";
import { PdfProcessor } from "@/lib/pdf-handler/processor";
import {
  FormDataFileExtractor,
  TextContentExtractor,
} from "@/lib/pdf-handler/extractors";
import {
  parsePdfOptions,
  parseS3Config,
} from "@/lib/pdf-handler/options-parser";
import {
  sendErrorResponse,
  sendS3SuccessResponse,
  streamPdfResponse,
  downloadPdfResponse,
} from "@/lib/pdf-handler/response-formatters";

const pdfProcessor = new PdfProcessor([
  new FormDataFileExtractor(),
  new TextContentExtractor(),
]);

export async function file2pdf(c: Context) {
  try {
    const options = parsePdfOptions(c);

    if (options.uploadToS3 && options.streamResponse) {
      return sendErrorResponse(
        c,
        "Cannot stream and upload to S3 at the same time",
      );
    }

    const contentType = c.req.header("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return sendErrorResponse(
        c,
        "Content-Type must be multipart/form-data with a file field",
      );
    }

    const result = await pdfProcessor.process(c, options);

    if (!result.success) {
      return sendErrorResponse(c, result.message || "PDF generation failed");
    }

    if (result.url) {
      return sendS3SuccessResponse(c, result.url);
    }

    if (options.streamResponse && result.pdfBuffer) {
      return streamPdfResponse(c, result.pdfBuffer, options.filename);
    }

    if (result.pdfBuffer) {
      return downloadPdfResponse(result.pdfBuffer, options.filename);
    }

    return sendErrorResponse(c, "Unexpected error", 500);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    return sendErrorResponse(c, "Unexpected error", 500);
  }
}

export async function text2pdf(c: Context) {
  try {
    const options = parsePdfOptions(c);

    if (options.uploadToS3 && options.streamResponse) {
      return sendErrorResponse(
        c,
        "Cannot stream and upload to S3 at the same time",
      );
    }

    const contentType = c.req.header("content-type") || "";
    if (
      !contentType.startsWith("text/plain") &&
      !contentType.startsWith("application/json")
    ) {
      return sendErrorResponse(
        c,
        "Content-Type must be text/plain or application/json with a `source` field",
      );
    }

    const result = await pdfProcessor.process(c, options);

    if (!result.success) {
      return sendErrorResponse(c, result.message || "PDF generation failed");
    }

    if (result.url) {
      return sendS3SuccessResponse(c, result.url);
    }

    if (options.streamResponse && result.pdfBuffer) {
      return streamPdfResponse(c, result.pdfBuffer, options.filename);
    }

    if (result.pdfBuffer) {
      return downloadPdfResponse(result.pdfBuffer, options.filename);
    }

    return sendErrorResponse(c, "Unexpected error", 500);
  } catch (err) {
    console.error("Text to PDF Error:", err);
    return sendErrorResponse(c, "Unexpected error", 500);
  }
}

export async function mys3pdf(c: Context) {
  try {
    const options = parsePdfOptions(c);
    const s3Config = parseS3Config(c);

    if (!s3Config) {
      return sendErrorResponse(
        c,
        "Missing one or more required headers: access key, secret, endpoint, bucket, or CDN URL",
      );
    }

    // Override options to ensure S3 upload
    options.uploadToS3 = true;
    options.streamResponse = false;
    options.s3Config = s3Config;

    // Set custom filename if provided
    if (c.req.header("x-s3-filename")) {
      options.filename = c.req.header("x-s3-filename") || options.filename;
    }

    const contentType = c.req.header("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return sendErrorResponse(
        c,
        "Content-Type must be multipart/form-data with a .typ file",
      );
    }

    const result = await pdfProcessor.process(c, options);

    if (!result.success) {
      return sendErrorResponse(c, result.message || "PDF generation failed");
    }

    if (result.url) {
      return sendS3SuccessResponse(c, result.url);
    }

    return sendErrorResponse(c, "Unexpected error", 500);
  } catch (err) {
    console.error("Custom S3 Upload Error:", err);
    return sendErrorResponse(c, "Unexpected error", 500);
  }
}
