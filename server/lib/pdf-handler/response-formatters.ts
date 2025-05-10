import { Context } from "hono";
import { stream } from "hono/streaming";
import { ContentfulStatusCode } from "hono/utils/http-status";

export function sendErrorResponse(
  c: Context,
  message: string,
  status: ContentfulStatusCode = 400,
): Response {
  return c.json({ success: false, message }, status);
}

export function sendS3SuccessResponse(c: Context, url: string): Response {
  return c.json({ success: true, url });
}

export function streamPdfResponse(
  c: Context,
  pdfBuffer: Uint8Array,
  filename: string,
): Response {
  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", "inline; filename=" + filename);

  return stream(c, async (stream) => {
    stream.onAbort(() => console.log("Stream aborted"));
    stream.write(pdfBuffer);
    stream.close();
  });
}

export function downloadPdfResponse(
  pdfBuffer: Uint8Array,
  filename: string,
): Response {
  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=" + filename,
    },
  });
}
