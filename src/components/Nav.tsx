"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Boletim" },
  { href: "/monitor/", label: "Governo atual" },
  { href: "/mapa/", label: "Mapa do voto" },
  { href: "/comparar/", label: "Comparar" },
  { href: "/checagem/", label: "Checagem" },
  { href: "/metodologia/", label: "Metodologia" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-bg">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-display shrink-0 text-2xl" aria-label="Governou, página inicial">
          GOVERNOU<span className="text-pen">?</span>
        </Link>
        <nav className="-mx-1 flex flex-1 gap-5 overflow-x-auto text-sm sm:justify-end">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" || path.startsWith("/governo") : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap px-1 py-1 underline-offset-[6px] ${active ? "font-bold text-ink underline decoration-pen decoration-2" : "text-muted hover:text-ink"}`}
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
