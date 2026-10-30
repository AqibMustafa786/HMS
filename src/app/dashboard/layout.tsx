import { AppShell } from "@/components/app-shell";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const principal = await resolveTrustedPrincipal(cookieStore.get("__session")?.value ?? "");
  if (!principal || principal.status !== "active") redirect("/login");

  return <AppShell>{children}</AppShell>;
}
