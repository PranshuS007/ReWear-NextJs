import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { mode, name, email, password, role } = body;
  const emailOk = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  if (mode === "register") {
    if (!name || !emailOk || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (String(password).length < 8) return NextResponse.json({ error: "Password must be 8+ characters" }, { status: 400 });
    if (String(name).length > 80) return NextResponse.json({ error: "Name too long" }, { status: 400 });
    const exists = db.prepare("SELECT id FROM users WHERE email=?").get(email.trim().toLowerCase());
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    const r = db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)")
      .run(String(name).slice(0, 80), email.trim().toLowerCase(), bcrypt.hashSync(String(password), 12), role === "seller" ? "seller" : "buyer");
    const token = await signSession({ id: Number(r.lastInsertRowid), role: role === "seller" ? "seller" : "buyer" });
    (await cookies()).set("rewear_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800, path: "/" });
    return NextResponse.json({ ok: true });
  }
  if (!emailOk || typeof password !== "string") return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const u: any = db.prepare("SELECT * FROM users WHERE email=?").get((email as string).trim().toLowerCase());
  if (!u || !bcrypt.compareSync(password, u.password_hash)) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const token = await signSession({ id: u.id, role: u.role });
  (await cookies()).set("rewear_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800, path: "/" });
  return NextResponse.json({ ok: true, role: u.role, name: u.name });
}
export async function DELETE() {
  (await cookies()).delete("rewear_session");
  return NextResponse.json({ ok: true });
}
