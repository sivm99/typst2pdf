import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import pdfRouter from "@/routes/pdfRouter";
import authRouter from "@/routes/authRouter";
import { serveStatic } from "hono/bun";
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
  .route("/api/v1/pdf", pdfRouter)
  .route("/api/auth", authRouter)
  .get("/health", (c) => {
    return c.text("Hey I'm alive\n");
  })
  .get("/about", (c) => c.redirect(aboutPage))
  .use(
    "*",
    serveStatic({
      root: "./frontend/dist",
    }),
  )
  .use(
    "*",
    serveStatic({
      path: "./frontend/dist/index.html",
    }),
  );
export default app;
