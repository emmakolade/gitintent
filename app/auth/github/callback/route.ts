import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, getSessionCookieOptions } from "@/lib/auth/session";
import { fetchGitHubAccessToken, fetchGitHubProfile, upsertGitHubUser } from "@/lib/auth/github";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "gitintent_oauth_state";

export async function GET(request: NextRequest) {
  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get("code");
  const state = callbackUrl.searchParams.get("state");

  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const accessToken = await fetchGitHubAccessToken(code);
    const { profile, primaryEmail } = await fetchGitHubProfile(accessToken);
    const user = await upsertGitHubUser({ profile, primaryEmail });

    const sessionToken = await createSessionToken({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      profileSlug: user.profileSlug,
    });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.set(getSessionCookieName(), sessionToken, getSessionCookieOptions());

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
