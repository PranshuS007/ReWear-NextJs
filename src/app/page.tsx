"use client";
import { useEffect, useState } from "react";
const inr = (p: number) => "₹" + (p / 100).toLocaleString("en-IN");

const IMGS = [
  "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=60", // denim
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=60", // tee
  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=60", // dress/kurti
  "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=60", // cargos
  "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=60", // kidswear
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=60", // jacket
];
const imgFor = (i: any) => IMGS[(i.id - 1 + IMGS.length) % IMGS.length];
const input = "border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-stone-400 placeholder:text-stone-400 text-stone-900 dark:text-stone-100";

export default function Home() {
  const [mode, setMode] = useState<"buyer" | "seller">("buyer");
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [size, setSize] = useState(""); const [max, setMax] = useState("");
  const [showAuth, setShowAuth] = useState(false); const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer" });
  const [sell, setSell] = useState({ title: "", price: "", mrp: "", category: "College fits", size: "M", condition: "Like new", description: "" });
  const [dash, setDash] = useState<any>(null);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("rewear-theme") === "dark";
    setDark(saved);
  }, []);
  const toggleDark = () => {
    const next = !dark; setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("rewear-theme", next ? "dark" : "light");
  };
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("rewear-theme") === "dark") document.documentElement.classList.add("dark");
  }, []);

  const me = async () => { const r = await fetch("/api/me").then(r => r.json()); setUser(r.user); };
  const load = async () => {
    const p = new URLSearchParams(); if (q) p.set("q", q); if (cat) p.set("cat", cat); if (size) p.set("size", size); if (max) p.set("max", max);
    setItems(await fetch("/api/listings?" + p).then(r => r.json()));
  };
  const loadDash = async () => { const r = await fetch("/api/orders"); if (r.ok) setDash(await r.json()); };
  useEffect(() => { me(); load(); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, cat, size, max]);
  useEffect(() => { if (user && mode === "seller") loadDash(); }, [user, mode]);

  const submitAuth = async () => {
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: authMode, ...form }) });
    const j = await r.json();
    if (!r.ok) return alert(j.error);
    setShowAuth(false); await me(); loadDash();
  };
  const buy = async (id: number, title: string) => {
    if (!user) { setAuthMode("login"); setShowAuth(true); return; }
    const addr = prompt("Delivery address for: " + title) || "";
    const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: id, address: addr }) });
    const j = await r.json();
    if (!r.ok) return alert(j.error);
    alert(`Payment of ${inr(j.paid)} captured. Order #${j.order_id} placed.`);
    load();
  };
  const publish = async () => {
    const r = await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sell) });
    const j = await r.json();
    if (!r.ok) return alert(j.error || "Login as seller first");
    alert("Published. Listing #" + j.id); setSell({ ...sell, title: "", price: "" }); load(); loadDash();
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors">
      {/* Slim premium header */}
      <header className="sticky top-0 z-10 bg-[#faf9f7]/90 dark:bg-stone-950/90 backdrop-blur border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6 flex-wrap">
          <div>
            <div className="text-xl font-semibold tracking-tight">ReWear</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Curated pre-loved fashion</div>
          </div>
          <nav className="flex gap-1 text-sm ml-4">
            <button onClick={() => setMode("buyer")} className={`px-4 py-2 rounded-full transition ${mode === "buyer" ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}>Shop</button>
            <button onClick={() => setMode("seller")} className={`px-4 py-2 rounded-full transition ${mode === "seller" ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}>Sell</button>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <button onClick={toggleDark} aria-label="Toggle theme" className="w-9 h-9 rounded-full border border-stone-300 flex items-center justify-center hover:border-stone-900 transition">
              {dark ? "☀️" : "🌙"}
            </button>
            {user ? <><span className="text-stone-500">{user.name} · <span className="capitalize">{user.role}</span></span><button className="underline underline-offset-2 text-stone-500" onClick={async () => { await fetch("/api/auth", { method: "DELETE" }); setUser(null); setDash(null); }}>Sign out</button></>
              : <button onClick={() => setShowAuth(true)} className="bg-stone-900 text-white px-5 py-2 rounded-full text-sm hover:bg-stone-700 transition">Sign in</button>}
          </div>
        </div>
      </header>

      {mode === "buyer" ? (<>
        {!user ? (
          <div>
            <div className="max-w-6xl mx-auto px-6 pt-20 pb-14 text-center">
              <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 mb-4">ReWear — Curated pre-loved fashion</p>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight max-w-3xl mx-auto">Beautiful pre-loved clothing, without the rummage.</h1>
              <p className="mt-5 text-stone-500 max-w-xl mx-auto text-[15px] leading-relaxed">Inside: authenticated kidswear, campus fits, ethnic pieces and streetwear — from verified independent sellers, escrow-protected, at a fraction of retail.</p>
              <div className="mt-8 flex gap-3 justify-center">
                <button onClick={() => { setAuthMode("register"); setShowAuth(true); }} className="bg-stone-900 text-white px-8 py-3 rounded-full text-sm hover:bg-stone-700 transition">Create free account</button>
                <button onClick={() => { setAuthMode("login"); setShowAuth(true); }} className="border border-stone-300 px-8 py-3 rounded-full text-sm hover:border-stone-900 transition">Sign in</button>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-6 pb-6 grid sm:grid-cols-3 gap-px bg-stone-200 border border-stone-200 rounded-2xl overflow-hidden text-center">
              {[["Kidswear", "Parent-approved bundles & occasion wear"], ["College fits", "Campus staples under ₹1,000"], ["Ethnic & Streetwear", "Curated drops from indie sellers"]].map(([t, d]) => (
                <div key={t} className="bg-white p-8"><div className="font-semibold">{t}</div><div className="text-sm text-stone-500 mt-1">{d}</div></div>))}
            </div>
            {/* running carousel — teaser, no prices, click prompts sign-in */}
            <div className="overflow-hidden border-y border-stone-200 bg-white py-5">
              <div className="flex gap-4 w-max animate-[scroll_30s_linear_infinite]" style={{ animationName: "rwscroll" }}>
                {[...IMGS, ...IMGS].map((src, k) => (
                  <button key={k} onClick={() => setShowAuth(true)} className="w-44 h-56 rounded-xl overflow-hidden shrink-0 group relative">
                    <img src={src} alt="Curated piece" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent text-white text-[11px] py-2 text-center opacity-0 group-hover:opacity-100 transition">Sign in to view</span>
                  </button>
                ))}
              </div>
            </div>
            <style>{`@keyframes rwscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
            <div className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-3 gap-6 text-sm text-stone-500">
              <div><b className="text-stone-900 block mb-1">Verified sellers</b>Every seller is ID-checked and rated after each order.</div>
              <div><b className="text-stone-900 block mb-1">Escrow payments</b>Money is released to the seller only after delivery.</div>
              <div><b className="text-stone-900 block mb-1">Easy returns</b>7-day returns on anything materially misdescribed.</div>
            </div>
          </div>
        ) : (
        <div>
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 mb-3">The Autumn Edit — authenticated pieces</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight max-w-2xl">Exceptional pre-loved clothing, curated for parents and students.</h1>
          <p className="mt-3 text-stone-500 max-w-xl text-[15px] leading-relaxed">Every piece is seller-verified and escrow-protected. Thoughtful prices, considered condition grading, no noise.</p>
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="flex gap-2 flex-wrap py-5 border-y border-stone-200 mb-8 sticky top-[73px] bg-[#faf9f7]/95 backdrop-blur z-[5]">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search kurtis, denim, kidswear…" className={`${input} flex-1 min-w-[220px] dark:bg-stone-900 dark:border-stone-700 dark:text-stone-100`} />
            <select value={cat} onChange={e => setCat(e.target.value)} className={input}><option value="">Category</option><option>Kidswear</option><option>College fits</option><option>Ethnic</option><option>Streetwear</option></select>
            <select value={size} onChange={e => setSize(e.target.value)} className={input}><option value="">Size</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>Kids 4-6</option><option>Kids 8-10</option></select>
            <select value={max} onChange={e => setMax(e.target.value)} className={input}><option value="">Price</option><option value="500">Under ₹500</option><option value="1000">Under ₹1,000</option></select>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-5">{items.length} pieces</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {items.map(i => (
              <div key={i.id} className="group">
                <div className="aspect-[4/5] rounded-xl bg-stone-100 overflow-hidden">
                  <img src={imgFor(i)} alt={i.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" />
                </div>
                <div className="pt-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-medium leading-snug">{i.title}</div>
                    <div className="text-xs text-stone-400 mt-1">{i.size} · {i.condition} · {i.verified ? "Verified seller" : i.seller}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{inr(i.price_paise)}</div>
                    {i.mrp_paise > 0 && <s className="text-xs text-stone-400">{inr(i.mrp_paise)}</s>}
                  </div>
                </div>
                <button onClick={() => buy(i.id, i.title)} className="mt-3 w-full border border-stone-900 rounded-full py-2.5 text-sm font-medium hover:bg-stone-900 hover:text-white transition">Reserve — {inr(i.price_paise)}</button>
              </div>))}
          </div>
          {items.length === 0 && <p className="text-center py-16 text-stone-400">No pieces match. Try broadening your filters.</p>}
        </div>
        </div>
        )}
      </>) : (<>
        <div className="max-w-6xl mx-auto px-6 py-12">
          {!user ? (
            <div className="border border-stone-200 rounded-2xl p-12 text-center bg-white">
              <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400">For sellers</p>
              <h1 className="text-4xl font-semibold tracking-tight mt-2">Your wardrobe, curated for sale.</h1>
              <p className="mt-3 text-stone-500 max-w-md mx-auto text-[15px]">An 8% commission. Doorstep pickup, escrow payouts to UPI, and a quiet, serious buyer base.</p>
              <button onClick={() => { setAuthMode("register"); setForm({ ...form, role: "seller" }); setShowAuth(true); }} className="mt-6 bg-stone-900 text-white px-8 py-3 rounded-full text-sm hover:bg-stone-700 transition">Become a seller</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-200 border border-stone-200 rounded-2xl overflow-hidden">
                {[["Revenue", inr(dash?.stats?.revenue || 0)], ["Orders", dash?.stats?.orders || 0], ["Rating", `${user.rating?.toFixed?.(1) || "5.0"}`], ["Live listings", dash?.mine?.length || 0]].map(([k, v]) => (
                  <div key={k} className="bg-white p-6"><div className="text-2xl font-semibold">{v}</div><div className="text-[11px] uppercase tracking-[0.18em] text-stone-400 mt-1">{k}</div></div>))}
              </div>
              <div className="grid md:grid-cols-5 gap-6 mt-6">
                <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 h-fit">
                  <h3 className="font-semibold mb-1">New listing</h3>
                  <p className="text-xs text-stone-400 mb-4">Goes live to buyers immediately.</p>
                  <div className="space-y-2">
                    <input value={sell.title} onChange={e => setSell({ ...sell, title: e.target.value })} placeholder="Title — e.g. Biba peach kurti, size S" className={`${input} w-full`} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={sell.price} onChange={e => setSell({ ...sell, price: e.target.value })} placeholder="Price ₹" type="number" className={input} />
                      <input value={sell.mrp} onChange={e => setSell({ ...sell, mrp: e.target.value })} placeholder="MRP ₹" type="number" className={input} />
                      <select value={sell.category} onChange={e => setSell({ ...sell, category: e.target.value })} className={input}><option>Kidswear</option><option>College fits</option><option>Ethnic</option><option>Streetwear</option></select>
                      <select value={sell.size} onChange={e => setSell({ ...sell, size: e.target.value })} className={input}><option>XS</option><option>S</option><option>M</option><option>L</option><option>Kids 4-6</option><option>Kids 8-10</option></select>
                    </div>
                    <textarea value={sell.description} onChange={e => setSell({ ...sell, description: e.target.value })} placeholder="Condition notes…" rows={3} className={`${input} w-full`} />
                  </div>
                  <button onClick={publish} className="mt-4 w-full bg-stone-900 text-white py-2.5 rounded-full text-sm hover:bg-stone-700 transition">Publish listing</button>
                </div>
                <div className="md:col-span-3 bg-white border border-stone-200 rounded-2xl p-6">
                  <h3 className="font-semibold mb-3">Inventory &amp; orders</h3>
                  {(dash?.mine || []).map((l: any) => <div key={l.id} className="flex justify-between py-2.5 border-b border-stone-100 text-sm"><span>{l.title}</span><span className="text-stone-500">{inr(l.price_paise)} · {l.status}</span></div>)}
                  {(dash?.sales || []).map((o: any) => <div key={o.id} className="text-sm py-2">Order #{o.id} — {o.title} · {inr(o.amount_paise)} · {o.status}</div>)}
                  {!dash?.mine?.length && <p className="text-sm text-stone-400">No listings yet.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </>)}

      <footer className="border-t border-stone-200 dark:border-stone-800 mt-8"><div className="max-w-6xl mx-auto px-6 py-8 text-xs text-stone-400 flex gap-6 flex-wrap"><span>ReWear — curated pre-loved fashion</span><span>Escrow-protected payments</span><span>8% seller commission</span></div></footer>

      {showAuth && (
        <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center p-4 z-20" onClick={() => setShowAuth(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold tracking-tight">{authMode === "login" ? "Welcome back" : "Create account"}</h3>
            <p className="text-sm text-stone-400 mb-5">Buyers and sellers share one account.</p>
            <div className="space-y-2">
              {authMode === "register" && <><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={`${input} w-full`} /><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={`${input} w-full`}><option value="buyer">I want to buy</option><option value="seller">I want to sell</option></select></>}
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className={`${input} w-full`} />
              <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" className={`${input} w-full`} />
            </div>
            <button onClick={submitAuth} className="w-full bg-stone-900 text-white py-2.5 rounded-full text-sm mt-4 hover:bg-stone-700 transition">{authMode === "login" ? "Sign in" : "Create account"}</button>
            <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="w-full text-center text-sm text-stone-500 mt-3 underline underline-offset-2">{authMode === "login" ? "New here? Create account" : "Have an account? Sign in"}</button>
            <p className="text-[11px] text-stone-400 mt-3 text-center">Demo: priya@rewear.in · password123</p>
          </div>
        </div>
      )}
    </div>
  );
}
