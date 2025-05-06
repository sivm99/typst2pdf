import { Context } from "hono";
import { compileTypstToPDF } from "@/utils/pdf";

export async function mys3pdf(c: Context) {
  try {
    const contentType = c.req.header("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return c.json(
        {
          success: false,
          message: "Content-Type must be multipart/form-data with a .typ file",
        },
        400,
      );
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    if (!file || !(file instanceof File)) {
      return c.json(
        { success: false, message: "Missing or invalid .typ file" },
        400,
      );
    }

    // Get S3 config from headers
    const accessKeyId = c.req.header("x-s3-access-key") ?? "";
    const secretAccessKey = c.req.header("x-s3-secret-key") ?? "";
    const endpoint = c.req.header("x-s3-endpoint") ?? "";
    const bucket = c.req.header("x-s3-bucket") ?? "";
    const cdnUrl = c.req.header("x-s3-cdn-url") ?? "";
    const filename =
      c.req.header("x-s3-filename") ?? `${crypto.randomUUID()}.pdf`;

    if (!accessKeyId || !secretAccessKey || !endpoint || !bucket || !cdnUrl) {
      return c.json(
        {
          success: false,
          message:
            "Missing one or more required headers: access key, secret, endpoint, bucket, or CDN URL",
        },
        400,
      );
    }

    // Compile PDF
    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    const pdfBuffer = await compileTypstToPDF(fileBuffer);

    const cs3 = new Bun.S3Client();

    const upload = await cs3.write(filename, pdfBuffer, {
      type: "application/pdf",
      accessKeyId,
      secretAccessKey,
      endpoint,
      bucket,
    });

    if (!upload) {
      console.error("Upload failed:");
      return c.json({ success: false, message: "S3 upload failed" }, 500);
    }

    return c.json({
      success: true,
      url: `${cdnUrl.replace(/\/$/, "")}/${filename}`,
    });
  } catch (err) {
    console.error("Custom S3 Upload Error:", err);
    return c.json(
      { success: false, message: "Syntax error , probably file missing" },
      400,
    );
  }
}
