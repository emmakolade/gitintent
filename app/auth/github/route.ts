import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "gitintent_oauth_state";

export async function GET() {
  if (!env.githubClientId || !env.githubCallbackUrl) {
    throw new Error("Missing required environment variables: GITHUB_CLIENT_ID and GITHUB_CALLBACK_URL");
  }

  const state = randomBytes(24).toString("hex");

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", env.githubClientId);
  authUrl.searchParams.set("redirect_uri", env.githubCallbackUrl);
  authUrl.searchParams.set("scope", "user:email");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
