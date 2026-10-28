import type { Term } from "@/lib/types";

/** Monograma tipográfico — evita uso de fotos com direitos autorais. */
export function Initials({ term, size = 48 }: { term: Term; size?: number }) {
  const parts = term.president.split(" ");
  const ini = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (
    <div
      className="grid shrink-0 place-items-center rounded-xl border border-line bg-gradient-to-br from-surface-2 to-surface font-mono font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      aria-hidden
    >
      {ini}
    </div>
  );
}
