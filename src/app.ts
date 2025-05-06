import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import pdfRouter from "@/routes/pdfRouter";
import authRouter from "@/routes/authRouter";
import securePdfRouter from "@/routes/spdfRouter";

const aboutPage = process.env.ABOUT_PAGE || "";
const app = new Hono()
  .use(
    poweredBy({
      serverName: "hono-by-sivam",
    }),
  )
  .use(secureHeaders())
  .use(logger())
  .use(cors())
  .route("/v1/pdf", pdfRouter)
  .route("/v1/secure/pdf", securePdfRouter)
  .route("/auth", authRouter)
  .get("/health", (c) => {
    return c.text("Hey I'm alive\n");
  })
  .get("/about", (c) => c.redirect(aboutPage));
export default app;
