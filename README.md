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

## Project structure

- `src/server.ts` app bootstrap
- `src/routes/web.ts` auth + dashboard + tracking routes
- `src/models/User.ts` user data and unique slug
- `src/models/Activity.ts` tracked events
- `src/services/email.ts` Gmail SMTP sender
- `src/views/*` HTML pages (EJS)
- `src/public/styles.css` styles
