import { cookies } from "next/headers";
import { createHmac } from "crypto";

export const COOKIE_NAME = "session";

const secret = process.env.SESSION_SECRET ?? "dev-secret-change-me";

function sign(payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function isValidSessionCookie(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  return sign(payload) === signature;
}

export async function createSession() {
  const payload = "authenticated";
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
