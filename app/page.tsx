import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/session";

export default async function LandingPage() {
  const session = await getSessionFromCookies();
  if (session?.userId && session.profileSlug && session.displayName && session.username) {
    redirect("/dashboard");
  }

  return (
    <main className="layout">
      <section className="card hero">
        <p className="eyebrow">GitIntent</p>
        <h1>Get notified when someone checks your GitHub.</h1>
        <p className="content">
          Connect your GitHub, share your tracked link anywhere, and get instant email alerts with source, location,
          and time whenever someone visits.
        </p>
        <Link className="btn" href="/auth/github">
          Continue with GitHub
        </Link>
      </section>
    </main>
  );
}
