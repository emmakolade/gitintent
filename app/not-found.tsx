import Link from "next/link";

export default function NotFound() {
  return (
    <main className="layout">
      <section className="card">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="content">This profile or route does not exist.</p>
        <Link className="btn" href="/">
          Go Home
        </Link>
      </section>
    </main>
  );
}
