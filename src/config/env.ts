import dotenv from "dotenv";

dotenv.config();

const required = [
  "SESSION_SECRET",
  "MONGODB_URI",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 3000),
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  sessionSecret: process.env.SESSION_SECRET as string,
  mongoUri: process.env.MONGODB_URI as string,
  githubClientId: process.env.GITHUB_CLIENT_ID as string,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL as string,
  gmailUser: process.env.GMAIL_USER as string,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD as string,
};
