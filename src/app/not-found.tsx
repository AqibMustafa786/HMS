import Link from "next/link";

export default function NotFound() {
  return <main className="route-state"><h1>Page not found</h1><p>This page is not part of the current workspace.</p><Link className="btn btn-secondary" href="/dashboard">Return to dashboard</Link></main>;
}
