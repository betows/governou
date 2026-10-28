"use client";

import Link from "next/link";
import { eventsFor, factchecksFor } from "@/lib/data";
import { MIN_EVENTS, eventsBalance, formatScore } from "@/lib/scoring";
import { TERMS, TERM_BY_ID, formatPeriod } from "@/lib/terms";
import type { TermId } from "@/lib/types";
import { toneVar } from "@/lib/ui";
import { EventList } from "./EventList";
import { FactCheckList } from "./FactCheckList";
import { GradeRing } from "./GradeRing";
import { IndicatorTable } from "./IndicatorTable";
import { Initials } from "./Initials";
import { PillarBars } from "./PillarBars";
import { useScores } from "./ScoreProvider";

export function TermDetail({ id }: { id: TermId }) {
  const term = TERM_BY_ID[id];
  const { scores, options } = useScores();
  const s = scores[id];
  const events = eventsFor(id);
  const checks = factchecksFor(id);
  const balance = eventsBalance(events);
  const idx = TERMS.findIndex((t) => t.id === id);
  const prev = TERMS[idx - 1];
  const next = TERMS[idx + 1];
  const totalWeight = s.pillars.reduce((a, p) => a + (p.score !== null ? options.weights[p.pillar.id] : 0), 0) || 1;

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="rise grid gap-8 border-b border-line py-12 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ← Todos os governos
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <Initials term={term} size={64} />
            <div>
              <h1 className="font-display text-4xl font-bold leading-none sm:text-6xl">{term.label}</h1>
              <p className="mt-2 text-muted">
                {term.president} · {term.party} · {formatPeriod(term)} · vice: {term.vice}
              </p>
            </div>
          </div>
          {s.provisional && (
            <p className="mt-5 max-w-2xl rounded-xl border border-[color-mix(in_oklab,var(--mid)_45%,transparent)] bg-[color-mix(in_oklab,var(--mid)_10%,transparent)] px-4 py-3 text-sm">
              <strong>Nota prévia.</strong> Só {Math.round(s.coverage * 100)}% dos indicadores oficiais deste mandato já foram
              verificados. A nota definitiva aparece quando a cobertura passar de 60%.
            </p>
          )}
          {term.note && <p className="mt-5 max-w-2xl rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">{term.note}</p>}
        </div>
        <div className="flex items-center gap-6">
          <GradeRing score={s.score} size={168} stroke={12} provisional={s.provisional} />
        </div>
      </section>

      <section className="grid gap-10 py-12 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <h2 className="font-display text-3xl font-bold">Como a nota foi formada</h2>
          <p className="mt-2 text-sm text-muted">
            Cada pilar recebe uma nota de 0 a 10. A nota final é a média ponderada dos pilares com dados (cobertura de
            indicadores: <span className="tabular text-ink">{Math.round(s.coverage * 100)}%</span>).
          </p>
          <div className="mt-6 glass rounded-2xl p-5">
            <PillarBars pillars={s.pillars} />
          </div>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted">
                <th className="pb-2 font-medium">Pilar</th>
                <th className="pb-2 text-right font-medium">Nota</th>
                <th className="pb-2 text-right font-medium">Peso</th>
                <th className="pb-2 text-right font-medium">Contribui</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {s.pillars.map((p) => {
                const w = p.score === null ? 0 : options.weights[p.pillar.id] / totalWeight;
                return (
                  <tr key={p.pillar.id} className="border-t border-line">
                    <td className="py-2">{p.pillar.name}</td>
                    <td className="py-2 text-right">{formatScore(p.score)}</td>
                    <td className="py-2 text-right text-muted">{p.score === null ? "fora" : `${Math.round(w * 100)}%`}</td>
                    <td className="py-2 text-right font-medium">{p.score === null ? "—" : `+${formatScore(p.score * w)}`}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-accent font-semibold">
                <td className="py-2">Nota final</td>
                <td />
                <td />
                <td className="py-2 text-right" style={{ color: toneVar(s.score) }}>
                  {formatScore(s.score)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          {s.pillars
            .filter((p) => p.pillar.id !== "gestao")
            .map((p) => (
              <div key={p.pillar.id} className="glass rounded-2xl p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold">{p.pillar.name}</h3>
                  <span className="tabular font-display text-2xl" style={{ color: toneVar(p.score) }}>
                    {formatScore(p.score)}
                  </span>
                </div>
                <p className="text-sm text-muted">{p.pillar.description}</p>
                <IndicatorTable pillar={p} />
              </div>
            ))}
        </div>
      </section>

      <section className="border-t border-line py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold">Acertos e erros</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Fatos relevantes do mandato, classificados por resultado mensurável e consenso técnico — cada um com fonte.
              {balance.count < MIN_EVENTS
                ? ` Levantamento em andamento (${balance.count} de no mínimo ${MIN_EVENTS} fatos): este pilar ainda não entra na nota.`
                : " Pesos: ● pequeno · ●● relevante · ●●● impacto nacional."}
            </p>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-great">+{balance.pos}</span> /{" "}
            <span className="font-semibold text-awful">−{balance.neg}</span> /{" "}
            <span className="font-semibold text-mid">±{balance.mixed}</span>
          </div>
        </div>
        <div className="mt-6">
          <EventList events={events} />
        </div>
      </section>

      {checks.length > 0 && (
        <section className="border-t border-line py-12">
          <h2 className="font-display text-3xl font-bold">Checagem de fatos</h2>
          <p className="mt-1 text-sm text-muted">Boatos e declarações sobre este governo verificados por agências de checagem.</p>
          <div className="mt-6">
            <FactCheckList checks={checks} />
          </div>
        </section>
      )}

      <nav className="flex justify-between border-t border-line py-8 text-sm">
        {prev ? (
          <Link href={`/governo/${prev.id}/`} className="text-muted hover:text-ink">
            ← {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/governo/${next.id}/`} className="text-muted hover:text-ink">
            {next.label} →
          </Link>
        )}
      </nav>
    </div>
  );
}
