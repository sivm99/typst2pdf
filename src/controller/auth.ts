import { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { upsertUser } from "@/utils/db";

// GitHub OAuth configuration - should be set in environment variables
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const HOST = process.env.HOST || "http://localhost:6969";
const REDIRECT_URI = `${HOST}/api/auth/github/callback`;
// Start GitHub OAuth flow by redirecting to GitHub
export function loginWithGitHub(c: Context) {
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.append("client_id", GITHUB_CLIENT_ID);
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("scope", "read:user user:email");

  return c.redirect(authUrl.toString());
}

// Handle GitHub callback after user authorizes the app
export async function githubCallback(c: Context) {
  const code = c.req.query("code");

  if (!code) {
    return c.json({ error: "Authorization code missing" }, 400);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return c.json({ error: "Failed to get access token" }, 400);
    }

    // Get user profile with the access token
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    const githubProfile = await userResponse.json();

    if (!githubProfile.id) {
      return c.json({ error: "Failed to get GitHub profile" }, 400);
    }

    // Store or update user in database
    const user = upsertUser({
      githubId: githubProfile.id.toString(),
      name: githubProfile.name,
      avatarUrl: githubProfile.avatar_url,
    });

    // Set secure HTTP-only cookie with the user's token
    setCookie(c, "auth_token", user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return c.redirect("/user/dashboard");
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
}

// Handle user logout
export function logout(c: Context) {
  // Clear the authentication cookie
  deleteCookie(c, "auth_token");
  return c.redirect("/login");
}
