import type { Term } from "@/lib/types";

/** Monograma tipográfico — evita uso de fotos com direitos autorais. */
export function Initials({ term, size = 48 }: { term: Term; size?: number }) {
  const parts = term.president.split(" ");
  const ini = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full border border-line bg-surface-2 font-serif text-ink"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {ini}
    </div>
  );
}
