import type { AdminRole, SessionInfo } from "../backend.d";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface StoredSession {
  token: string;
  email: string;
  role: AdminRole;
  mustChangePassword: boolean;
  loginType: "admin" | "staff";
}

export function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem("sessionInfo");
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function saveSession(
  token: string,
  info: SessionInfo,
  loginType: "admin" | "staff",
): void {
  const stored: StoredSession = {
    token,
    email: info.email,
    role: info.role,
    mustChangePassword: info.mustChangePassword,
    loginType,
  };
  localStorage.setItem("sessionToken", token);
  localStorage.setItem("sessionInfo", JSON.stringify(stored));
}

export function updateMustChangePassword(value: boolean): void {
  const session = getSession();
  if (!session) return;
  session.mustChangePassword = value;
  localStorage.setItem("sessionInfo", JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem("sessionToken");
  localStorage.removeItem("sessionInfo");
}

export function isMainAdmin(session: StoredSession | null): boolean {
  if (!session) return false;
  return "mainAdmin" in session.role;
}
