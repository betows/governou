import type { PillarResult } from "@/lib/scoring";
import { formatScore } from "@/lib/scoring";
import { toneVar } from "@/lib/ui";

export function PillarBars({ pillars, compact = false }: { pillars: PillarResult[]; compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-1.5" : "space-y-3"}>
      {pillars.map((p) => (
        <li key={p.pillar.id} className="grid grid-cols-[5.5rem_1fr_2.25rem] items-center gap-3 text-sm sm:grid-cols-[7.5rem_1fr_2.5rem]">
          <span className={`truncate text-muted ${compact ? "text-xs" : ""}`}>{compact ? p.pillar.short : p.pillar.name}</span>
          <span className="relative h-1.5 overflow-hidden rounded-full bg-surface-2">
            {p.score !== null && (
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${p.score * 10}%`, background: toneVar(p.score), transition: "width .6s" }}
              />
            )}
          </span>
          <span className={`tabular text-right font-medium ${compact ? "text-xs" : ""}`} style={{ color: p.score === null ? "var(--muted)" : undefined }}>
            {formatScore(p.score)}
          </span>
        </li>
      ))}
    </ul>
  );
}
