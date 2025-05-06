import { Hono } from "hono";
import { file2pdf } from "@/controller/file2pdf";
import { text2pdf } from "@/controller/text2pdf";
import { mys3pdf } from "@/controller/mys3pdf";
import { authenticate } from "@/middlewares/protect";

const pdfRouter = new Hono()
  .use("*", authenticate)
  .post("/", file2pdf)
  .post("/text", text2pdf)
  .post("/mys3", mys3pdf);

export default pdfRouter;
