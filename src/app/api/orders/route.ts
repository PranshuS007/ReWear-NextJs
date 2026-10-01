import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// buyer creates order (mock payment), seller dashboard, mark sold
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const me: any = db.prepare("SELECT role FROM users WHERE id=?").get(s.id);
  if (me?.role !== "buyer") {
    const sales = db.prepare(`SELECT o.*, l.title FROM orders o JOIN listings l ON l.id=o.listing_id WHERE l.seller_id=? ORDER BY o.created_at DESC`).all(s.id);
    const stats: any = db.prepare(`SELECT COUNT(*) orders, COALESCE(SUM(amount_paise),0) revenue FROM orders o JOIN listings l ON l.id=o.listing_id WHERE l.seller_id=?`).get(s.id);
    const mine = db.prepare("SELECT * FROM listings WHERE seller_id=? ORDER BY created_at DESC").all(s.id);
    return NextResponse.json({ view: "seller", sales, stats, mine });
  }
  const orders = db.prepare(`SELECT o.*, l.title, l.price_paise FROM orders o JOIN listings l ON l.id=o.listing_id WHERE o.buyer_id=? ORDER BY o.created_at DESC`).all(s.id);
  return NextResponse.json({ view: "buyer", orders });
}
export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { listing_id, address } = await req.json();
  if (!Number.isInteger(Number(listing_id))) return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
  if (address && String(address).length > 500) return NextResponse.json({ error: "Address too long" }, { status: 400 });
  const l: any = db.prepare("SELECT * FROM listings WHERE id=? AND status='active'").get(Number(listing_id));
  if (!l) return NextResponse.json({ error: "Not available" }, { status: 404 });
  if (l.seller_id === s.id) return NextResponse.json({ error: "Can't buy your own item" }, { status: 400 });
  // atomic claim: only one buyer can win the race
  const claimed = db.prepare("UPDATE listings SET status='sold' WHERE id=? AND status='active'").run(l.id);
  if (claimed.changes === 0) return NextResponse.json({ error: "Just sold" }, { status: 409 });
  const r = db.prepare("INSERT INTO orders (buyer_id,listing_id,amount_paise,address) VALUES (?,?,?,?)").run(s.id, l.id, l.price_paise, String(address || "").slice(0, 500));
  db.prepare("UPDATE users SET sales=sales+1 WHERE id=?").run(l.seller_id);
  return NextResponse.json({ ok: true, order_id: r.lastInsertRowid, paid: l.price_paise });
}
