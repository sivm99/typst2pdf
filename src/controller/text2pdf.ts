import { Context } from "hono";
import { compileTypstToPDF } from "@/utils/pdf";
import { uploadToS3 } from "@/utils/upload";
import { stream } from "hono/streaming";

export async function text2pdf(c: Context) {
  const uploadFlag = c.req.header("x-upload") === "true"; // default: false
  const filename = c.req.header("x-filename") || `${crypto.randomUUID()}.pdf`;
  const streamFlag = !uploadFlag && c.req.header("x-stream") !== "false";

  if (uploadFlag && c.req.header("x-stream") === "true") {
    return c.json(
      {
        success: false,
        message: "Cannot stream and upload to S3 at the same time",
      },
      400,
    );
  }

  try {
    const contentType = c.req.header("content-type") || "";

    let source: string | undefined;

    if (contentType.startsWith("text/plain")) {
      source = await c.req.text();
    } else if (contentType.startsWith("application/json")) {
      const body = await c.req.json();
      source = body.source;
    } else {
      return c.json(
        {
          success: false,
          message:
            "Content-Type must be text/plain or application/json with a `source` field",
        },
        400,
      );
    }

    if (!source || typeof source !== "string") {
      return c.json(
        { success: false, message: "Missing or invalid Typst source" },
        400,
      );
    }

    const sourceBuffer = new TextEncoder().encode(source);
    const pdfBuffer = await compileTypstToPDF(sourceBuffer);

    if (uploadFlag) {
      const url = await uploadToS3(pdfBuffer, filename);
      return c.json({ success: true, url });
    }

    if (streamFlag) {
      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", "inline; filename=" + filename);
      return stream(c, async (stream) => {
        stream.onAbort(() => console.log("Stream aborted"));
        stream.write(pdfBuffer);
        stream.close();
      });
    }

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=" + filename,
      },
    });
  } catch (err) {
    console.error("Text to PDF Error:", err);
    return c.json({ success: false, message: "Failed to generate PDF" }, 500);
  }
}
