import { Hono } from "hono";
import { mys3pdf, text2pdf, file2pdf } from "@/controller/pdf-controller";
import { authenticate } from "@/middlewares/protect";

const pdfRouter = new Hono()
  .use("*", authenticate)
  .post("/", file2pdf)
  .post("/text", text2pdf)
  .post("/mys3", mys3pdf);

export default pdfRouter;
