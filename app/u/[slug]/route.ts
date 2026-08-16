import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Activity } from "@/lib/models/Activity";
import { sendActivityEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { getClientIp, getClientLocation } from "@/lib/tracking";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    await connectDatabase();

    const { slug } = await context.params;
    const user = await User.findOne({ profileSlug: slug });
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const source =
      typeof request.nextUrl.searchParams.get("ref") === "string"
        ? request.nextUrl.searchParams.get("ref")!
        : "shared-link";
    const referrer = `${env.baseUrl}/u/${user.profileSlug}`;
    const location = getClientLocation(request);

    const activity = await Activity.create({
      ownerId: user._id,
      eventType: "GITHUB_CLICK",
      source,
      referrer,
      location,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || undefined,
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

    return NextResponse.redirect(user.githubUrl);
  } catch (error) {
    console.error("Failed to process tracked link click", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
