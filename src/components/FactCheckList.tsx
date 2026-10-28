import { TERM_BY_ID } from "@/lib/terms";
import type { FactCheck } from "@/lib/types";
import { VERDICT_META, fmtDate } from "@/lib/ui";
import { Sources } from "./Sources";

export function FactCheckList({ checks }: { checks: FactCheck[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {checks.map((c) => {
        const v = VERDICT_META[c.verdict];
        return (
          <article key={c.id} className="flex flex-col glass rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white"
                style={{ background: v.color }}
              >
                {v.label}
              </span>
              <span className="text-xs text-muted" title={c.dateApprox ? "Data aproximada" : undefined}>
                {c.dateApprox && "≈ "}
                {fmtDate(c.date)}
              </span>
            </div>
            <blockquote className="mt-3 font-display text-xl leading-snug">“{c.claim}”</blockquote>
            <p className="mt-1 text-xs text-muted">
              Autor: {c.claimant}
              {c.about.length > 0 && <> · Sobre: {c.about.map((t) => TERM_BY_ID[t]?.label).join(", ")}</>}
            </p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{c.explanation}</p>
            <div className="mt-4">
              <Sources sources={c.sources} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
