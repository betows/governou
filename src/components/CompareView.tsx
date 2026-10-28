"use client";

import { useState } from "react";
import { PILLARS, RULES, formatScore } from "@/lib/scoring";
import { TERMS, TERM_BY_ID } from "@/lib/terms";
import type { TermId } from "@/lib/types";
import { toneVar } from "@/lib/ui";
import { Grade, Stamp } from "./Grade";
import { useScores } from "./ScoreProvider";

export function CompareView() {
  const { scores } = useScores();
  const [a, setA] = useState<TermId>("lula3");
  const [b, setB] = useState<TermId>("bolsonaro");

  const ind = (id: TermId, rid: string) => scores[id].pillars.flatMap((p) => p.indicators).find((i) => i.rule.id === rid);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl font-bold">Comparar governos</h1>
      <p className="mt-2 text-muted">Lado a lado, com a mesma régua.</p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {[
          [a, setA],
          [b, setB],
        ].map(([val, set], i) => (
          <div key={i} className="sheet p-5">
            <select
              value={val as TermId}
              onChange={(e) => (set as (v: TermId) => void)(e.target.value as TermId)}
              className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm font-medium"
              aria-label={`Governo ${i + 1}`}
            >
              {TERMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="mt-5 flex justify-center">
              <div className="flex items-center gap-5">
                <Grade score={scores[val as TermId].score} provisional={scores[val as TermId].provisional} size="lg" />
                <Stamp score={scores[val as TermId].score} provisional={scores[val as TermId].provisional} size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Table title="Pilares">
        {PILLARS.map((p) => {
          const sa = scores[a].pillars.find((x) => x.pillar.id === p.id)?.score ?? null;
          const sb = scores[b].pillars.find((x) => x.pillar.id === p.id)?.score ?? null;
          return <Row key={p.id} label={p.name} a={sa} b={sb} />;
        })}
      </Table>

      <Table title="Indicadores oficiais">
        {RULES.map((r) => {
          const ia = ind(a, r.id);
          const ib = ind(b, r.id);
          return <Row key={r.id} label={r.label} a={ia?.score ?? null} b={ib?.score ?? null} ea={ia?.explanation} eb={ib?.explanation} />;
        })}
      </Table>
      <p className="mt-4 text-xs text-muted">
        {TERM_BY_ID[a].label} × {TERM_BY_ID[b].label}. Notas recalculadas com os pesos escolhidos na página inicial.
      </p>
    </div>
  );
}

function Table({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 sheet p-5">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({ label, a, b, ea, eb }: { label: string; a: number | null; b: number | null; ea?: string; eb?: string }) {
  const winA = a !== null && b !== null && a > b;
  const winB = a !== null && b !== null && b > a;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 text-sm">
      <div className="text-right">
        <div className={`tabular font-display text-2xl ${winA ? "" : "opacity-70"}`} style={{ color: toneVar(a) }}>
          {formatScore(a)}
        </div>
        {ea && <div className="text-xs text-muted">{ea}</div>}
      </div>
      <div className="w-28 text-center text-xs font-medium uppercase tracking-wider text-muted sm:w-44">{label}</div>
      <div>
        <div className={`tabular font-display text-2xl ${winB ? "" : "opacity-70"}`} style={{ color: toneVar(b) }}>
          {formatScore(b)}
        </div>
        {eb && <div className="text-xs text-muted">{eb}</div>}
      </div>
    </div>
  );
}
