import type { PillarResult } from "@/lib/scoring";
import { formatScore } from "@/lib/scoring";
import { toneVar } from "@/lib/ui";
import { Sparkline } from "./Sparkline";

export function IndicatorTable({ pillar }: { pillar: PillarResult }) {
  return (
    <div className="divide-y divide-line">
      {pillar.indicators.map((i) => (
        <div key={i.rule.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_15rem_3.5rem] sm:items-center">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{i.rule.label}</span>
              {i.partial && i.score !== null && (
                <span className="rounded bg-surface-2 px-1.5 text-[10px] uppercase tracking-wider text-muted" title="Nem todos os anos do mandato têm dado oficial">
                  parcial
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted">{i.explanation}</p>
            <p className="mt-1 text-xs text-muted">
              Faixa: {fmt(i.rule.worst)} = 0 · {fmt(i.rule.best)} = 10 ({i.rule.unit})
              {i.series?.sourceUrl ? (
                <>
                  {" · "}
                  <a href={i.series.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {i.series.officialSource} ↗
                  </a>
                </>
              ) : (
                i.series && <> · {i.series.officialSource}</>
              )}
            </p>
          </div>
          <div className="hidden sm:block">{i.series && <Sparkline values={i.series.values} highlight={i.yearsUsed} />}</div>
          <div className="tabular text-right text-2xl font-serif" style={{ color: i.score === null ? "var(--muted)" : toneVar(i.score) }}>
            {formatScore(i.score)}
          </div>
        </div>
      ))}
    </div>
  );
}

const fmt = (v: number) => v.toLocaleString("pt-BR");
