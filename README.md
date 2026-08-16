# GitIntent (Next.js + Cloudflare)

GitIntent is now fully rewritten in Next.js (App Router) and prepared for Cloudflare deployment using OpenNext.

## Stack

- Next.js (App Router)
- TypeScript
- MongoDB + Mongoose
- GitHub OAuth (custom OAuth flow)
- Resend Email API for activity alerts
- OpenNext for Cloudflare Workers deployment

## Features

- GitHub login
- Per-user tracked URL: `/u/:slug`
- Redirect to GitHub profile on tracked link hit
- Track click source, location, IP, and user agent
- Email alerts for tracked click activity
- Dashboard for copying tracked links and syncing user timezone

## Environment variables

Copy `.env.example` to `.env` and configure:

- `BASE_URL` (ex: `http://localhost:3000`)
- `SESSION_SECRET` (long random secret)
- `MONGODB_URI`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (ex: `http://localhost:3000/auth/github/callback`)
- `RESEND_API_KEY`
- `ALERT_FROM_EMAIL` (verified sender in Resend)

## GitHub OAuth settings

Configure your GitHub OAuth app:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/auth/github/callback`

For production, switch both values to your deployed domain.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build (local validation)

```bash
npm run build
npm start
```

## Cloudflare deployment

1. Authenticate Wrangler:

```bash
npx wrangler login
```

2. Build and deploy:

```bash
npm run cf:deploy
```

3. In Cloudflare dashboard (or via Wrangler), set all required environment variables for your Worker.

## App routes

- `/` landing page
- `/dashboard` authenticated dashboard
- `/auth/github` OAuth start
- `/auth/github/callback` OAuth callback
- `/logout` clears session
- `/dashboard/regenerate-link` regenerate slug
- `/api/dashboard/timezone` save timezone
- `/u/[slug]` tracked redirect endpoint
