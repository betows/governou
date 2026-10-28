"use client";

import Link from "next/link";
import { eventsFor } from "@/lib/data";
import { eventsBalance } from "@/lib/scoring";
import { formatPeriod } from "@/lib/terms";
import type { Term } from "@/lib/types";
import { GradeRing } from "./GradeRing";
import { Initials } from "./Initials";
import { PillarBars } from "./PillarBars";
import { useScores } from "./ScoreProvider";

export function TermCard({ term, rank, index = 0 }: { term: Term; rank?: number; index?: number }) {
  const { scores } = useScores();
  const s = scores[term.id];
  const b = eventsBalance(eventsFor(term.id));
  return (
    <Link
      href={`/governo/${term.id}/`}
      className="rise group relative flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_12px_40px_-20px_color-mix(in_oklab,var(--ink)_40%,transparent)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {term.current && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Em curso
        </span>
      )}
      <div className="flex items-center gap-3">
        <Initials term={term} size={44} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{term.label}</div>
          <div className="text-xs text-muted">
            {formatPeriod(term)} · {term.party}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <GradeRing score={s.score} size={104} provisional={s.provisional} />
        <div className="min-w-0 flex-1">
          <PillarBars pillars={s.pillars} compact />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
        <span>
          <span className="font-semibold text-great">{b.pos}</span> acertos ·{" "}
          <span className="font-semibold text-awful">{b.neg}</span> erros
          <span className="opacity-60"> (pontos ponderados)</span>
        </span>
        <span className="tabular">{rank ? `#${rank}` : `${Math.round(s.coverage * 100)}% dados`}</span>
      </div>
    </Link>
  );
}
