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
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink font-serif text-lg text-bg">R</span>
          <span className="hidden sm:inline">Raio-X do Planalto</span>
        </Link>
        <nav className="-mx-2 flex flex-1 gap-1 overflow-x-auto text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" || path.startsWith("/governo") : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${active ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
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
