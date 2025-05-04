import { Context } from "hono";
import { compileTypstToPDF } from "@/utils/pdf";
import { uploadToS3 } from "@/utils/upload";
import { stream } from "hono/streaming";

export async function file2pdf(c: Context) {
  const uploadFlag = c.req.header("x-upload") === "true"; // default: false
  const filename = c.req.header("x-filename") || `${crypto.randomUUID()}.pdf`;
  const streamFlag = !uploadFlag && c.req.header("x-stream") !== "false";

  if (uploadFlag && c.req.header("x-stream") === "true") {
    console.log("i was here");
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
    if (!contentType.startsWith("multipart/form-data")) {
      return c.json(
        {
          success: false,
          message: "Content-Type must be multipart/form-data with a file field",
        },
        400,
      );
    }

    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch (err) {
      return c.json(
        {
          success: false,
          message:
            "Invalid multipart/form-data request. Please check your form and boundary.",
        },
        400,
      );
    }

    const file = formData.get("file") as File;
    if (!file || !(file instanceof File)) {
      return c.json(
        { success: false, message: "Missing or invalid .typ file" },
        400,
      );
    }

    const fileBuffer = new Uint8Array(await file.arrayBuffer());

    // Compile Typst to PDF
    const pdfBuffer = await compileTypstToPDF(fileBuffer);

    if (uploadFlag) {
      console.log(new Date(), "i reached here very soone");
      const url = await uploadToS3(pdfBuffer, filename);
      console.log(new Date(), "url was arived");
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

    // Fallback (download instead of stream)
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=" + filename,
      },
    });
  } catch (err) {
    console.error("PDF Generation Error:", err);
    return c.json({ success: false, message: "Failed to generate PDF" }, 500);
  }
}
