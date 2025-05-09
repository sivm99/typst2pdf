import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import pdfRouter from "@/routes/pdfRouter";
import authRouter from "@/routes/authRouter";
import { serveStatic } from "hono/bun";
const app = new Hono()
  .use(
    poweredBy({
      serverName: "hono-by-sivam",
    }),
  )
  .use(secureHeaders())
  .use(logger())
  .use(cors())
  .get("/health", (c) => {
    return c.text("Hey I'm alive\n");
  });
const apiRoutes = app
  .basePath("/api")
  .route("/v1/pdf", pdfRouter)
  .route("/auth", authRouter);

app
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
export type ApiRoutes = typeof apiRoutes;
