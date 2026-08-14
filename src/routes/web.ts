import { Router, Request } from "express";
import passport from "passport";
import { ensureAuthenticated } from "../middleware/auth";
import { User } from "../models/User";
import { Activity } from "../models/Activity";
import { sendActivityEmail } from "../services/email";
import { createSlugCandidate } from "../utils/slug";
import { env } from "../config/env";

const router = Router();

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === "string" && entry.trim());
    if (first) return first.trim();
  }
  return undefined;
}

function isLocalIp(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("127.") ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function getClientLocation(req: Request): string {
  const city = firstHeaderValue(req.headers["x-vercel-ip-city"]);
  const region = firstHeaderValue(req.headers["x-vercel-ip-country-region"]);
  const country =
    firstHeaderValue(req.headers["x-vercel-ip-country"]) ||
    firstHeaderValue(req.headers["cf-ipcountry"]) ||
    firstHeaderValue(req.headers["x-country-code"]);

  const location = [city, region, country].filter(Boolean).join(", ");
  if (location) return location;

  const ip = getClientIp(req);
  if (!ip) return "unknown";
  if (isLocalIp(ip)) return "local-network";

  return `ip:${ip}`;
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

router.get("/", async (req, res) => {
  if (req.isAuthenticated() && req.user) {
    const user = await User.findById(String(req.user)).lean();
    if (user) {
      return res.redirect("/dashboard");
    }
  }

  return res.render("landing", {
    title: "GitIntent",
  });
});

router.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/",
  }),
  (_req, res) => {
    res.redirect("/dashboard");
  }
);

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  const user = await User.findById(String(req.user)).lean();
  if (!user) return res.redirect("/");

  return res.render("dashboard", {
    title: "Your Dashboard",
    user,
    baseUrl: env.baseUrl,
  });
});

router.post("/dashboard/regenerate-link", ensureAuthenticated, async (req, res) => {
  const user = await User.findById(String(req.user));
  if (!user) return res.redirect("/");

  for (let i = 0; i < 100; i++) {
    const candidate = createSlugCandidate(user.username, i);
    const exists = await User.findOne({ profileSlug: candidate }).lean();
    if (!exists || String(exists._id) === String(user._id)) {
      user.profileSlug = candidate;
      await user.save();
      break;
    }
  }

  res.redirect("/dashboard");
});

router.post("/dashboard/timezone", ensureAuthenticated, async (req, res) => {
  const user = await User.findById(String(req.user));
  if (!user) return res.status(404).json({ ok: false });

  const submittedTimezone = typeof req.body?.timezone === "string" ? req.body.timezone.trim() : "";
  if (!submittedTimezone || !isValidTimeZone(submittedTimezone)) {
    return res.status(400).json({ ok: false });
  }

  if (user.timezone !== submittedTimezone) {
    user.timezone = submittedTimezone;
    await user.save();
  }

  return res.json({ ok: true });
});

router.get("/u/:slug", async (req, res) => {
  const user = await User.findOne({ profileSlug: req.params.slug });
  if (!user) return res.status(404).render("not-found", { title: "Not Found" });

  const source = typeof req.query.ref === "string" ? req.query.ref : "shared-link";
  const referrer = `${env.baseUrl}/u/${user.profileSlug}`;
  const location = getClientLocation(req);

  const activity = await Activity.create({
    ownerId: user._id,
    eventType: "GITHUB_CLICK",
    source,
    referrer,
    location,
    ipAddress: getClientIp(req),
    userAgent: req.get("user-agent"),
  });

  await sendActivityEmail({
    to: user.notifyEmail,
    ownerName: user.displayName,
    profileSlug: user.profileSlug,
    eventType: "GITHUB_CLICK",
    source,
    referrer,
    location,
    ownerTimezone: user.timezone || "UTC",
    occurredAt: activity.createdAt,
  });

  return res.redirect(user.githubUrl);
});

export default router;
