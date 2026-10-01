import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null });
  const u: any = db.prepare("SELECT id,name,email,role,college,city,rating,sales,verified FROM users WHERE id=?").get(s.id);
  return NextResponse.json({ user: u || null });
}
