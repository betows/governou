import { DATA } from "@/lib/data";

/** Faixa rolante com o último valor verificado de cada série oficial. */
export function Ticker() {
  const items = DATA.indicators
    .filter((i) => !i.id.includes("_mundo") && !i.id.includes("_emergentes"))
    .map((i) => {
      const years = Object.keys(i.values).map(Number).sort((a, b) => a - b);
      if (years.length < 1) return null;
      const y = years[years.length - 1];
      const v = i.values[y];
      const prev = i.values[y - 1];
      const up = prev === undefined ? null : v > prev;
      return { id: i.id, name: i.name, y, v, up, unit: i.unit };
    })
    .filter(Boolean) as { id: string; name: string; y: number; v: number; up: boolean | null; unit: string }[];
  if (items.length === 0) return null;
  const row = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-b border-line bg-[rgba(10,15,26,0.6)]" aria-label="Últimos indicadores oficiais">
      <div className="marquee flex w-max gap-10 py-2 font-mono text-xs">
        {[...row, ...row].map((it, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted">{it.name.toUpperCase()}</span>
            <span className="text-muted/60">{it.y}</span>
            <span className="text-ink">{it.v.toLocaleString("pt-BR")}{it.unit.startsWith("%") ? "%" : ""}</span>
            {it.up !== null && <span className={it.up ? "text-great" : "text-awful"}>{it.up ? "▲" : "▼"}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
