"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="route-state"><h1>Workspace unavailable</h1><p>The page could not be loaded. Please try again.</p><button className="btn btn-primary" onClick={reset}>Try again</button></main>;
}
