import Image from "next/image";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { getSessionFromCookies } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session?.userId) {
    redirect("/");
  }

  if (!session.profileSlug || !session.displayName || !session.username) {
    redirect("/");
  }

  const profileLink = `${env.baseUrl}/u/${session.profileSlug}`;

  return (
    <main className="layout">
      <section className="card">
        <div className="dashboard-head">
          <div className="row">
            <Image
              className="avatar"
              src={session.avatarUrl || "https://avatars.githubusercontent.com/u/9919?s=200&v=4"}
              alt="avatar"
              width={72}
              height={72}
            />
            <div>
              <p className="eyebrow">GitIntent Console</p>
              <h1>{session.displayName}</h1>
              <p className="meta">@{session.username}</p>
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
