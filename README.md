# GitIntent MVP (Version 0)

A lean MVP built with:
- HTML/CSS (server-rendered EJS templates)
- TypeScript + Express
- MongoDB + Mongoose
- GitHub OAuth
- Gmail SMTP (activity email alerts)

## What this version does

- Users authenticate with GitHub.
- Each user gets a unique shareable link: `/u/:slug`.
- Visiting `/u/:slug` now redirects directly to the user's GitHub profile.
- That redirect is tracked as a `GITHUB_CLICK` activity.
- The owner receives email alerts for those activities.
- Dashboard currently does **not** display activity feed yet (email only), based on your request.

## 1. Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
copy .env.example .env
```

3. Fill `.env` values:
- `MONGODB_URI`
- `SESSION_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `BASE_URL`

## 2. GitHub OAuth app settings

In your GitHub OAuth app:
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/auth/github/callback`

Use your existing client ID and secret in `.env`.

## 3. Gmail SMTP note

Use a Gmail App Password (not your main account password).
- Account security -> 2-Step Verification -> App passwords.

## 4. Run

Development:

```bash
npm run dev
```

Build and run production-style:

```bash
npm run build
npm start
```

Open:
- Landing: `http://localhost:3000`
- After login, dashboard shows your unique shareable link.

## 5. Cloudflare deployment

If you are deploying with Wrangler and see:

`Could not detect a directory containing static files`

this project keeps static files in `src/public`, not `public` at the root.

Use:

```bash
npm run cf:deploy
```

or directly:

```bash
wrangler pages deploy src/public --project-name gitintent
```

Local Cloudflare preview:

```bash
npm run cf:dev
```

Important: this deploys only static assets (CSS/images/etc). The current app uses Express, Passport session auth, EJS rendering, and MongoDB, which are server runtime features and will not run as-is on static Pages hosting.

For full app deployment, use one of these paths:
- Keep this backend on a Node host (Render/Railway/Fly/VM) and use Cloudflare in front.
- Migrate backend routes to Cloudflare Workers/Pages Functions (larger refactor).

### Option 1: Node host + Cloudflare proxy (recommended for current codebase)

1. Deploy this app to a Node host (Render, Railway, Fly, VM) with:
- Build command: `npm run build`
- Start command: `npm start`

2. Set production env vars on the Node host:
- `NODE_ENV=production`
- `BASE_URL=https://your-domain.com`
- `GITHUB_CALLBACK_URL=https://your-domain.com/auth/github/callback`
- `TRUST_PROXY=true`
- `SESSION_COOKIE_SECURE=true`
- plus existing required vars (`MONGODB_URI`, `SESSION_SECRET`, SMTP and GitHub keys)

3. In Cloudflare DNS:
- Create `A`/`CNAME` record for your app domain pointing to your host.
- Enable proxy (orange cloud).

4. In GitHub OAuth App settings:
- Homepage URL: `https://your-domain.com`
- Authorization callback URL: `https://your-domain.com/auth/github/callback`

5. SSL/TLS in Cloudflare:
- Set mode to `Full (strict)` once your origin has a valid cert.

This keeps your existing Express + Passport + MongoDB architecture unchanged while using Cloudflare for DNS, TLS, caching, and edge protection.

## Project structure

- `src/server.ts` app bootstrap
- `src/routes/web.ts` auth + dashboard + tracking routes
- `src/models/User.ts` user data and unique slug
- `src/models/Activity.ts` tracked events
- `src/services/email.ts` Gmail SMTP sender
- `src/views/*` HTML pages (EJS)
- `src/public/styles.css` styles
