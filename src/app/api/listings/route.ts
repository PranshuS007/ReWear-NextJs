import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const where = ["status='active'"];
  const args: any[] = [];
  if (q.get("q")) { where.push("title LIKE ?"); args.push(`%${q.get("q")}%`); }
  if (q.get("cat")) { where.push("category=?"); args.push(q.get("cat")); }
  if (q.get("size")) { where.push("size=?"); args.push(q.get("size")); }
  if (q.get("max")) { where.push("price_paise<=?"); args.push(Number(q.get("max")) * 100); }
  const rows = db.prepare(`SELECT l.*, u.name seller, u.rating sr, u.verified FROM listings l JOIN users u ON u.id=l.seller_id WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 60`).all(...args);
  return NextResponse.json(rows);
}
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const b = await req.json();
  if (!b.title || !b.price || !b.category || !b.size) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const price = Number(b.price), mrp = Number(b.mrp || 0);
  const cats = ["Kidswear", "College fits", "Ethnic", "Streetwear"];
  if (!cats.includes(b.category) || !Number.isFinite(price) || price <= 0 || price > 100000) return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
  if (String(b.title).length > 120 || String(b.description || "").length > 2000) return NextResponse.json({ error: "Text too long" }, { status: 400 });
  db.prepare("UPDATE users SET role='seller' WHERE id=? AND role='buyer'").run(s.id);
  const r = db.prepare("INSERT INTO listings (seller_id,title,description,price_paise,mrp_paise,category,size,condition) VALUES (?,?,?,?,?,?,?,?)")
    .run(s.id, String(b.title).slice(0, 120), String(b.description || "").slice(0, 2000), Math.round(price * 100), Math.round(mrp * 100), b.category, String(b.size).slice(0, 20), String(b.condition || "Like new").slice(0, 30));
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}
