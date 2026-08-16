import Image from "next/image";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { connectDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    redirect("/");
  }

  await connectDatabase();
  const user = await User.findById(userId).lean();
  if (!user) {
    redirect("/");
  }

  const profileLink = `${env.baseUrl}/u/${user.profileSlug}`;

  return (
    <main className="layout">
      <section className="card">
        <div className="dashboard-head">
          <div className="row">
            <Image
              className="avatar"
              src={user.avatarUrl || "https://avatars.githubusercontent.com/u/9919?s=200&v=4"}
              alt="avatar"
              width={72}
              height={72}
            />
            <div>
              <p className="eyebrow">GitIntent Console</p>
              <h1>{user.displayName}</h1>
              <p className="meta">@{user.username}</p>
            </div>
          </div>

          <form method="post" action="/logout">
            <button type="submit" className="btn ghost logout-btn">
              Logout
            </button>
          </form>
        </div>

        <DashboardClient
          profileLink={profileLink}
          resumeLink={`${profileLink}?ref=resume`}
          linkedinLink={`${profileLink}?ref=linkedin`}
          portfolioLink={`${profileLink}?ref=portfolio`}
        />

        <form method="post" action="/dashboard/regenerate-link">
          <button type="submit" className="btn ghost">
            Regenerate Link
          </button>
        </form>
      </section>
    </main>
  );
}
