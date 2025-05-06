import { getUserByToken } from "@/utils/db";
import { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

export async function authenticate(c: Context, next: () => Promise<any>) {
  const token = getCookie(c, "auth_token");

  if (!token) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const user = getUserByToken(token);

  if (!user) {
    deleteCookie(c, "auth_token");
    return c.json({ error: "Invalid session" }, 401);
  }
  // Add user to context for route handlers
  c.set("user", user);
  return next();
}
