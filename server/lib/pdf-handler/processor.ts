import { Context } from "hono";
import { compileTypstToPDF } from "@/utils/pdf";
import { uploadToS3 } from "@/utils/upload";
import { ContentExtractor, ProcessResult, PdfOptions, S3Config } from "./types";

export class PdfProcessor {
  private extractors: ContentExtractor[];

  constructor(extractors: ContentExtractor[]) {
    this.extractors = extractors;
  }

  async process(c: Context, options: PdfOptions): Promise<ProcessResult> {
    // Validate options
    if (options.uploadToS3 && options.streamResponse) {
      return {
        success: false,
        message: "Cannot stream and upload to S3 at the same time",
      };
    }

    // Extract content
    const contentType = c.req.header("content-type") || "";
    const extractor = this.extractors.find((e) => e.canHandle(contentType));

    if (!extractor) {
      return {
        success: false,
        message: `Unsupported content type: ${contentType}`,
      };
    }

    const sourceBuffer = await extractor.extract(c);
    if (!sourceBuffer) {
      return {
        success: false,
        message: extractor.getErrorMessage(),
      };
    }

    try {
      // Generate PDF
      const pdfBuffer = await compileTypstToPDF(sourceBuffer);

      // Handle upload if needed
      if (options.uploadToS3) {
        try {
          let url: string;

          // Use custom S3 config if provided, otherwise use default
          if (options.s3Config) {
            const { accessKeyId, secretAccessKey, endpoint, bucket, cdnUrl } =
              options.s3Config;
            const cs3 = new Bun.S3Client();
            const upload = await cs3.write(options.filename, pdfBuffer, {
              type: "application/pdf",
              accessKeyId,
              secretAccessKey,
              endpoint,
              bucket,
            });

            if (!upload) {
              return { success: false, message: "S3 upload failed" };
            }

            url = `${cdnUrl.replace(/\/$/, "")}/${options.filename}`;
          } else {
            url = await uploadToS3(pdfBuffer, options.filename);
          }

          return { success: true, url };
        } catch (err) {
          console.error("S3 Upload Error:", err);
          return { success: false, message: "S3 upload failed" };
        }
      }

      // Return PDF buffer for direct response
      return {
        success: true,
        pdfBuffer,
      };
    } catch (err) {
      console.error("PDF Generation Error:", err);
      return {
        success: false,
        message: "PDF generation failed: syntax error or missing file",
      };
    }
  }
}
