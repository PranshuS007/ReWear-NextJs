import "./globals.css";
export const metadata = { title: "ReWear — Curated Pre-loved Fashion", description: "A curated marketplace for pre-loved clothing. Buyers: parents + students. Sellers: independent curators." };
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="bg-[#faf9f7] text-stone-900 min-h-screen">{children}</body></html>);
}
