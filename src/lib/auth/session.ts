import { cookies } from "next/headers";
import { resolveTrustedPrincipal } from "@/lib/authorization/session";

export const SESSION_COOKIE = "__session";

export async function getCurrentPrincipal() {
  const cookieStore = await cookies();
  return resolveTrustedPrincipal(cookieStore.get(SESSION_COOKIE)?.value ?? "");
}
