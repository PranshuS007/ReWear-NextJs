import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const DEV_SECRET = "rewear-dev-secret-change-me-32chars!!";
const key = new TextEncoder().encode(process.env.AUTH_SECRET || DEV_SECRET);

export async function signSession(payload: { id: number; role: string }) {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key);
}
export async function getSession(): Promise<{ id: number; role: string } | null> {
  const c = (await cookies()).get("rewear_session")?.value;
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c, key);
    return { id: payload.id as number, role: payload.role as string };
  } catch { return null; }
}
export const inr = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN");
