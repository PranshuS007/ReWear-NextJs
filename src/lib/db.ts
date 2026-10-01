import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

declare global { var __rewearDb: any | undefined; }

function buildDb(): any {
  const db = new Database(path.join(process.cwd(), "rewear.db"));
  db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK(role IN ('buyer','seller','both')),
  college TEXT DEFAULT '', city TEXT DEFAULT '', rating REAL DEFAULT 5.0,
  sales INTEGER DEFAULT 0, verified INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL, description TEXT DEFAULT '',
  price_paise INTEGER NOT NULL, mrp_paise INTEGER DEFAULT 0,
  category TEXT NOT NULL, size TEXT NOT NULL, condition TEXT DEFAULT 'Like new',
  status TEXT DEFAULT 'active', views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  amount_paise INTEGER NOT NULL, status TEXT DEFAULT 'placed',
  address TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL, reviewer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL, rating INTEGER NOT NULL, comment TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);
  try {
    const count = (db.prepare("SELECT COUNT(*) c FROM users").get() as any).c;
    if (count === 0) {
      const ins = db.prepare("INSERT INTO users (name,email,password_hash,role,college,city,rating,sales,verified) VALUES (?,?,?,?,?,?,?,?,1)");
      const sellers = [
        ["Priya Nair", "priya@rewear.in", "Christ University", "Bengaluru"],
        ["Aarav Mehta", "aarav@rewear.in", "IIT Delhi", "Delhi"],
        ["Zoya Khan", "zoya@rewear.in", "Sophia College", "Mumbai"],
      ];
      for (const [n, e, college, city] of sellers)
        ins.run(n, e, bcrypt.hashSync("password123", 10), "seller", college, city, 4.8, 20);
      const L = db.prepare("INSERT INTO listings (seller_id,title,description,price_paise,mrp_paise,category,size,condition,views) VALUES (?,?,?,?,?,?,?,?,?)");
      const data: any[] = [
        [1, "Kids denim jacket (4-6Y)", "Barely worn. Perfect for school.", 34900, 129900, "Kidswear", "Kids 4-6", "Like new", 412],
        [2, "Oversized anime tee", "One-wash thrift, campus favourite.", 29900, 89900, "College fits", "M", "Good", 880],
        [1, "Peach kurti - like new", "Worn once for Diwali.", 49900, 149900, "Ethnic", "S", "Like new", 305],
        [3, "Baggy Y2K cargos", "Streetwear staple.", 64900, 199900, "Streetwear", "M", "Excellent", 521],
        [1, "Kids party frock (8-10Y)", "Birthday-perfect.", 39900, 119900, "Kidswear", "Kids 8-10", "Like new", 268],
        [2, "Varsity jacket - premium", "Heavy fleece.", 99900, 299900, "College fits", "L", "Excellent", 640],
      ];
      for (const d of data) L.run(...d);
    }
  } catch { /* seed race */ }
  return db;
}

const db: any = global.__rewearDb ?? buildDb();
if (!global.__rewearDb) global.__rewearDb = db;
export default db;
