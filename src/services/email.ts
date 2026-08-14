import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.gmailUser,
    pass: env.gmailAppPassword,
  },
});

type ActivityEmailPayload = {
  to: string;
  ownerName: string;
  profileSlug: string;
  eventType: string;
  source?: string;
  referrer?: string;
  location?: string;
  ownerTimezone?: string;
  occurredAt?: Date;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventType(eventType: string): string {
  if (eventType === "GITHUB_CLICK") return "GitHub Profile Click";
  if (eventType === "PROFILE_VIEW") return "Profile View";
  return eventType;
}

function formatTimestamp(date: Date, ownerTimezone?: string): { value: string; usedTimezone: string } {
  const fallbackTimezone = "UTC";

  const formatForTimezone = (timeZone: string): string => {
    const formatted = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(date);

    return formatted.replace(" at ", ", ");
  };

  if (ownerTimezone) {
    try {
      const value = formatForTimezone(ownerTimezone);
      return { value, usedTimezone: ownerTimezone };
    } catch {
      // Fall through to UTC.
    }
  }

  const value = formatForTimezone(fallbackTimezone);
  return { value, usedTimezone: fallbackTimezone };
}

export async function sendActivityEmail(payload: ActivityEmailPayload): Promise<void> {
  const subject = "GitIntent: Someone viewed your Github";
  const profileUrl = `${env.baseUrl}/u/${payload.profileSlug}`;
  const eventType = formatEventType(payload.eventType);
  const source = payload.source || "unknown";
  const referrer = payload.referrer || "unknown";
  const location = payload.location || "unknown";
  const occurredAt = payload.occurredAt || new Date();
  const formattedTime = formatTimestamp(occurredAt, payload.ownerTimezone);

  const text = [
    `Hi ${payload.ownerName},`,
    "",
    `New activity was recorded on your profile: ${eventType}`,
    `Profile: ${profileUrl}`,
    `Source: ${source}`,
    `Referrer: ${referrer}`,
    `Location: ${location}`,
    `Time: ${formattedTime.value}`,
    "",
    "You asked to receive activity emails from GitIntent.",
  ].join("\n");

  const html = `
  <div style="margin:0;padding:28px 16px;background:#edf3ff;font-family:Arial,Helvetica,sans-serif;color:#12233b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
      <tr>
        <td>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #d6e3ff;border-radius:18px;box-shadow:0 16px 32px rgba(18,35,59,0.12);overflow:hidden;">
            <tr>
              <td style="padding:26px 28px;background:linear-gradient(135deg,#1f63db,#1a3f8a);color:#ffffff;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">GitIntent Activity Alert</p>
                <h1 style="margin:0;font-size:24px;line-height:1.2;">${escapeHtml(eventType)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 10px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Hi ${escapeHtml(payload.ownerName)}, New activity was recorded on your profile.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                  <tr>
                    <td style="width:110px;color:#506079;font-size:13px;">Profile</td>
                    <td style="font-size:14px;line-height:1.4;"><a href="${escapeHtml(profileUrl)}" style="color:#1f63db;text-decoration:none;">${escapeHtml(profileUrl)}</a></td>
                  </tr>
                  <tr>
                    <td style="width:110px;color:#506079;font-size:13px;">Source</td>
                    <td style="font-size:14px;"><span style="display:inline-block;padding:5px 10px;border-radius:999px;background:#eef3ff;color:#1a3f8a;font-weight:700;">${escapeHtml(source)}</span></td>
                  </tr>
                  <tr>
                    <td style="width:110px;color:#506079;font-size:13px;">Location</td>
                    <td style="font-size:14px;">${escapeHtml(location)}</td>
                  </tr>
                  <tr>
                    <td style="width:110px;color:#506079;font-size:13px;">Referrer</td>
                    <td style="font-size:14px;word-break:break-all;">${escapeHtml(referrer)}</td>
                  </tr>
                  <tr>
                    <td style="width:110px;color:#506079;font-size:13px;">Time</td>
                    <td style="font-size:14px;">${escapeHtml(formattedTime.value)} (${escapeHtml(formattedTime.usedTimezone)})</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 24px;">
                <a href="${escapeHtml(profileUrl)}" style="display:inline-block;padding:11px 16px;border-radius:10px;background:linear-gradient(135deg,#1f63db,#1a3f8a);color:#ffffff;text-decoration:none;font-weight:700;">Open Tracked Link</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  await transporter.sendMail({
    from: `GitIntent <${env.gmailUser}>`,
    to: payload.to,
    subject,
    text,
    html,
  });
}
