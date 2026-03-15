import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Buyer Demo", href: "/buyer" },
  { label: "Seller Mode", href: "/seller" },
  { label: "Admin View", href: "/admin" }
];

export function AppHeader({ className }: { className?: string }) {
  return (
    <header className={cn("border-b border-border/80 bg-white/90 backdrop-blur", className)}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <span className="rounded-xl bg-navy p-2 text-white">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide">TrustStream AI</p>
            <p className="text-[11px] text-slate-500">Livestream Trust Layer for ASEAN</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
