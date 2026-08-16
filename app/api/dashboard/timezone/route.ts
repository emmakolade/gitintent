import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { connectDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { isValidTimeZone } from "@/lib/tracking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await connectDatabase();

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const formData = await request.formData();
  const submittedTimezone = typeof formData.get("timezone") === "string" ? String(formData.get("timezone")).trim() : "";

  if (!submittedTimezone || !isValidTimeZone(submittedTimezone)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (user.timezone !== submittedTimezone) {
    user.timezone = submittedTimezone;
    await user.save();
  }

  return NextResponse.json({ ok: true });
}
