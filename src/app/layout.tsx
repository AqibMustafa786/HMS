import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Careflow | Hospital Operations",
  description: "Multi-tenant hospital operations platform.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Careflow", statusBarStyle: "default" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}" }} /></body>
    </html>
  );
}
