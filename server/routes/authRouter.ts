import { githubCallback, loginWithGitHub, logout } from "@/controller/auth";
import { Hono } from "hono";

const authRouter = new Hono()
  .get("/github", loginWithGitHub)
  .get("/github/callback", githubCallback)
  .get("/logout", logout);

export default authRouter;
