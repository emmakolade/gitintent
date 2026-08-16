import { connectDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { createSlugCandidate } from "@/lib/utils/slug";

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  html_url: string | null;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export async function createUniqueSlug(username: string): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const candidate = createSlugCandidate(username, i);
    const exists = await User.findOne({ profileSlug: candidate }).lean();
    if (!exists) return candidate;
  }

  throw new Error("Unable to generate unique profile slug");
}

export async function fetchGitHubAccessToken(code: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_CALLBACK_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing required GitHub environment variables");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with status ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || "GitHub token exchange did not return an access token");
  }

  return data.access_token;
}

export async function fetchGitHubProfile(accessToken: string): Promise<{ profile: GitHubUser; primaryEmail: string }> {
  const commonHeaders = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "gitintent-next",
  };

  const profileResponse = await fetch("https://api.github.com/user", {
    headers: commonHeaders,
  });

  if (!profileResponse.ok) {
    throw new Error(`Failed to fetch GitHub user profile (${profileResponse.status})`);
  }

  const profile = (await profileResponse.json()) as GitHubUser;

  const emailsResponse = await fetch("https://api.github.com/user/emails", {
    headers: commonHeaders,
  });

  if (!emailsResponse.ok) {
    throw new Error(`Failed to fetch GitHub email addresses (${emailsResponse.status})`);
  }

  const emails = (await emailsResponse.json()) as GitHubEmail[];
  const primary = emails.find((entry) => entry.primary && entry.verified) || emails.find((entry) => entry.verified);
  if (!primary?.email) {
    throw new Error("GitHub account does not expose a verified email address.");
  }

  return { profile, primaryEmail: primary.email };
}

export async function upsertGitHubUser(params: {
  profile: GitHubUser;
  primaryEmail: string;
}): Promise<{ userId: string; username: string; displayName: string; avatarUrl?: string; profileSlug: string }> {
  await connectDatabase();

  const githubId = String(params.profile.id);
  const username = params.profile.login || "developer";
  const displayName = params.profile.name || username || "Developer";
  const githubUrl = params.profile.html_url || `https://github.com/${username}`;

  let user = await User.findOne({ githubId });
  if (!user) {
    const slug = await createUniqueSlug(username);
    user = await User.create({
      githubId,
      username,
      displayName,
      avatarUrl: params.profile.avatar_url || undefined,
      githubUrl,
      notifyEmail: params.primaryEmail,
      profileSlug: slug,
    });
  } else {
    user.username = username || user.username;
    user.displayName = displayName || user.displayName;
    user.avatarUrl = params.profile.avatar_url || user.avatarUrl;
    user.githubUrl = githubUrl;
    user.notifyEmail = params.primaryEmail || user.notifyEmail;
    await user.save();
  }

  return {
    userId: String(user._id),
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    profileSlug: user.profileSlug,
  };
}
