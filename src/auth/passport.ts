import passport from "passport";
import { Strategy as GitHubStrategy, Profile } from "passport-github2";
import { env } from "../config/env";
import { User } from "../models/User";
import { createSlugCandidate } from "../utils/slug";

async function createUniqueSlug(username: string): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const candidate = createSlugCandidate(username, i);
    const exists = await User.findOne({ profileSlug: candidate }).lean();
    if (!exists) return candidate;
  }
  throw new Error("Unable to generate unique profile slug");
}

passport.use(
  new GitHubStrategy(
    {
      clientID: env.githubClientId,
      clientSecret: env.githubClientSecret,
      callbackURL: env.githubCallbackUrl,
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (error: Error | null, user?: string | false) => void
    ) => {
      try {
        const primaryEmail = profile.emails?.[0]?.value;
        if (!primaryEmail) {
          return done(new Error("GitHub account does not expose an email address."));
        }

        const githubUrl = profile.profileUrl || `https://github.com/${profile.username}`;

        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
          const slug = await createUniqueSlug(profile.username || "developer");
          user = await User.create({
            githubId: profile.id,
            username: profile.username || "developer",
            displayName: profile.displayName || profile.username || "Developer",
            avatarUrl: profile.photos?.[0]?.value,
            githubUrl,
            notifyEmail: primaryEmail,
            profileSlug: slug,
          });
        } else {
          user.username = profile.username || user.username;
          user.displayName = profile.displayName || user.displayName;
          user.avatarUrl = profile.photos?.[0]?.value || user.avatarUrl;
          user.githubUrl = githubUrl;
          if (primaryEmail) user.notifyEmail = primaryEmail;
          await user.save();
        }

        return done(null, user.id);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

passport.serializeUser((userId: unknown, done) => {
  done(null, String(userId));
});

passport.deserializeUser((userId: string, done) => {
  done(null, userId);
});

export default passport;
