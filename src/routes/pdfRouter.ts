import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { file2pdf } from "@/controller/file2pdf";
import { text2pdf } from "@/controller/text2pdf";
import { mys3pdf } from "@/controller/mys3pdf";

const token = process.env.TOKEN || "My-very-very-secret-single-password";

const pdfRouter = new Hono()
  .use("*", bearerAuth({ token }))
  .post("/", file2pdf)
  .post("/string", text2pdf)
  .post("/mys3", mys3pdf);

export default pdfRouter;
