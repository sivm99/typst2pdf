import { serve } from "bun";
import app from "@/app";

const PORT = process.env.PORT || 6969;
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1); // Exit and let process manager restart
});

serve({
  fetch: app.fetch,
  port: Number(PORT),
});
