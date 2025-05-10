import { Context } from "hono";
import { ContentExtractor } from "./types";

export class FormDataFileExtractor implements ContentExtractor {
  private errorMessage = "Missing or invalid .typ file";

  canHandle(contentType: string): boolean {
    return contentType.startsWith("multipart/form-data");
  }

  async extract(c: Context): Promise<Uint8Array | null> {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file || !(file instanceof File)) {
        return null;
      }

      return new Uint8Array(await file.arrayBuffer());
    } catch (err) {
      this.errorMessage =
        "Invalid multipart/form-data request. Please check your form and boundary.";
      return null;
    }
  }

  getErrorMessage(): string {
    return this.errorMessage;
  }
}

export class TextContentExtractor implements ContentExtractor {
  private errorMessage = "Missing or invalid Typst source";

  canHandle(contentType: string): boolean {
    return (
      contentType.startsWith("text/plain") ||
      contentType.startsWith("application/json")
    );
  }

  async extract(c: Context): Promise<Uint8Array | null> {
    let source: string | undefined;

    if (c.req.header("content-type")?.startsWith("text/plain")) {
      source = await c.req.text();
    } else if (c.req.header("content-type")?.startsWith("application/json")) {
      const body = await c.req.json();
      source = body.source;
    }

    if (!source || typeof source !== "string") {
      return null;
    }

    return new TextEncoder().encode(source);
  }

  getErrorMessage(): string {
    return this.errorMessage;
  }
}
