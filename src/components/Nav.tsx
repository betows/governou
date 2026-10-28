"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Governos" },
  { href: "/monitor/", label: "Monitor" },
  { href: "/comparar/", label: "Comparar" },
  { href: "/checagem/", label: "Checagem" },
  { href: "/metodologia/", label: "Metodologia" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[rgba(4,6,11,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 font-mono text-sm font-bold text-bg shadow-[0_0_20px_rgba(34,211,238,0.45)]">
            RX
          </span>
          <span className="hidden sm:inline">
            Raio-X <span className="text-muted">do Planalto</span>
          </span>
        </Link>
        <nav className="-mx-2 flex flex-1 gap-1 overflow-x-auto text-sm sm:justify-end">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" || path.startsWith("/governo") : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 transition ${active ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
