"use client";

import Link from "next/link";
import { useState } from "react";
import { eventsFor } from "@/lib/data";
import { PILLARS, RULES, formatScore } from "@/lib/scoring";
import { CURRENT_TERM, TERMS, TERM_BY_ID } from "@/lib/terms";
import type { TermId } from "@/lib/types";
import { IMPACT_META, fmtDate, toneVar } from "@/lib/ui";
import { GradeRing } from "./GradeRing";
import { useScores } from "./ScoreProvider";

export function MonitorView() {
  const { scores } = useScores();
  const cur = scores[CURRENT_TERM.id];
  const previous = TERMS.filter((t) => !t.current);
  const [ref, setRef] = useState<TermId | "media">("media");

  const refScoreFor = (get: (id: TermId) => number | null) => {
    if (ref !== "media") return get(ref);
    const vals = previous.map((t) => get(t.id)).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const pillarScore = (id: TermId, pid: string) => scores[id].pillars.find((p) => p.pillar.id === pid)?.score ?? null;
  const indScore = (id: TermId, rid: string) =>
    scores[id].pillars.flatMap((p) => p.indicators).find((i) => i.rule.id === rid)?.score ?? null;
  const indExpl = (id: TermId, rid: string) =>
    scores[id].pillars.flatMap((p) => p.indicators).find((i) => i.rule.id === rid)?.explanation;

  const refLabel = ref === "media" ? "média dos 5 anteriores" : TERM_BY_ID[ref].label;
  const recent = [...eventsFor(CURRENT_TERM.id)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="rise py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Monitor · atualização contínua</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">{CURRENT_TERM.label}</h1>
        <p className="mt-3 max-w-2xl text-muted">
          O governo atual medido com a mesma régua dos anteriores — e comparado com ele mesmo. Reeleito em 25/10/2026 para
          o mandato 2027–2030; a nota abaixo considera apenas anos com dado oficial fechado.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 text-muted">Comparar com:</span>
          {(["media", ...previous.map((t) => t.id)] as const).map((id) => (
            <button
              key={id}
              onClick={() => setRef(id)}
              className={`rounded-full border px-3 py-1.5 transition ${ref === id ? "border-ink bg-ink text-bg" : "border-line bg-surface text-muted hover:text-ink"}`}
            >
              {id === "media" ? "Média histórica" : TERM_BY_ID[id].label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-8 rounded-3xl border border-line bg-surface p-6">
          <div className="text-center">
            <GradeRing score={cur.score} size={140} stroke={11} provisional={cur.provisional} />
            <div className="mt-2 text-xs text-muted">Atual</div>
          </div>
          <div className="text-center">
            <GradeRing score={refScoreFor((id) => scores[id].score)} size={100} stroke={8} provisional={cur.provisional} />
            <div className="mt-2 max-w-[7rem] text-xs text-muted">{refLabel}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold">Pilar a pilar</h2>
          <ul className="mt-4 space-y-4">
            {PILLARS.map((p) => {
              const a = pillarScore(CURRENT_TERM.id, p.id);
              const b = refScoreFor((id) => pillarScore(id, p.id));
              return <CompareRow key={p.id} label={p.name} a={a} b={b} />;
            })}
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold">Indicador a indicador</h2>
        <p className="text-sm text-muted">Barra cheia: governo atual · marcador: {refLabel}.</p>
        <ul className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2">
          {RULES.map((r) => (
            <CompareRow
              key={r.id}
              label={r.label}
              a={indScore(CURRENT_TERM.id, r.id)}
              b={refScoreFor((id) => indScore(id, r.id))}
              hint={indExpl(CURRENT_TERM.id, r.id)}
            />
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-3xl tracking-tight">Fatos mais recentes</h2>
          <Link href={`/governo/${CURRENT_TERM.id}/`} className="text-sm text-accent hover:underline">
            Ver demonstrativo completo →
          </Link>
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {recent.map((e) => (
            <li key={e.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex gap-3 text-xs">
                <span className="font-semibold uppercase tracking-wider" style={{ color: IMPACT_META[e.impact].color }}>
                  {IMPACT_META[e.impact].label}
                </span>
                <span className="text-muted">{fmtDate(e.date)}</span>
              </div>
              <div className="mt-1 font-medium">{e.title}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CompareRow({ label, a, b, hint }: { label: string; a: number | null; b: number | null; hint?: string }) {
  const diff = a !== null && b !== null ? a - b : null;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular">
          <span style={{ color: toneVar(a) }} className="font-semibold">
            {formatScore(a)}
          </span>
          {diff !== null && (
            <span className={`ml-2 text-xs ${diff >= 0 ? "text-great" : "text-awful"}`}>
              {diff >= 0 ? "▲" : "▼"} {formatScore(Math.abs(diff))}
            </span>
          )}
        </span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-surface-2">
        {a !== null && <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${a * 10}%`, background: toneVar(a) }} />}
        {b !== null && <div className="absolute -top-1 h-4 w-0.5 rounded bg-ink" style={{ left: `calc(${b * 10}% - 1px)` }} title={`Referência: ${formatScore(b)}`} />}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </li>
  );
}
