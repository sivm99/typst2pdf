import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import pdfRouter from "./routes/pdfRouter";

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
  .get("/health", (c) => {
    return c.text("Hey I'm alive\n");
  })
  .get("/about", (c) => c.redirect(aboutPage));
export default app;
