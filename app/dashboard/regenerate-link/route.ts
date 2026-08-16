import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { connectDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { createSlugCandidate } from "@/lib/utils/slug";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    await connectDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    for (let i = 0; i < 100; i++) {
      const candidate = createSlugCandidate(user.username, i);
      const exists = await User.findOne({ profileSlug: candidate }).lean();
      if (!exists || String(exists._id) === String(user._id)) {
        user.profileSlug = candidate;
        await user.save();
        break;
      }
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Failed to regenerate profile link", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
