"use client";

import Link from "next/link";
import { electionOf, eventsFor, factchecksFor } from "@/lib/data";
import { MIN_EVENTS, eventsBalance, formatScore } from "@/lib/scoring";
import { TERMS, TERM_BY_ID } from "@/lib/terms";
import type { TermId } from "@/lib/types";
import { toneVar } from "@/lib/ui";
import { EventList } from "./EventList";
import { FactCheckList } from "./FactCheckList";
import { Grade, Stamp } from "./Grade";
import { IndicatorTable } from "./IndicatorTable";
import { PersonFile } from "./PersonFile";
import { PublicVote } from "./PublicVote";
import { ElectionMap } from "./ElectionMap";
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
  const election = electionOf(term.electionYear);
  const totalWeight = s.pillars.reduce((a, p) => a + (p.score !== null ? options.weights[p.pillar.id] : 0), 0) || 1;

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="pt-8">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← Voltar ao boletim
        </Link>
        <h1 className="font-display mt-4 text-5xl sm:text-7xl">{term.label}</h1>
      </div>

      <section className="grid gap-8 border-b border-line py-8 lg:grid-cols-[1fr_17rem] lg:items-start">
        <PersonFile
          term={term}
          number={idx + 1}
          aside={term.note ? <p className="bg-surface-2 px-4 py-3 text-sm text-muted">{term.note}</p> : undefined}
        />
        <aside className="sheet flex flex-col items-center gap-4 p-6 text-center lg:sticky lg:top-20">
          <span className="label">Média final</span>
          <Grade score={s.score} provisional={s.provisional} size="xl" />
          <Stamp score={s.score} provisional={s.provisional} size="lg" animate />
          <p className="text-xs text-muted">
            {Math.round(s.coverage * 100)}% dos indicadores com dado oficial verificado.
            {s.provisional && " Abaixo de 60%, a média é só uma prévia."}
          </p>
          <a href="#nota" className="text-sm font-bold text-pen underline underline-offset-4">
            Ver a conta
          </a>
        </aside>
      </section>

      <div className="pt-10">
        <PublicVote termId={id} algorithmScore={s.provisional ? null : s.score} />
      </div>

      <section id="nota" className="grid scroll-mt-20 gap-10 py-12 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <h2 className="font-display text-3xl font-bold">Como a nota foi formada</h2>
          <p className="mt-2 text-sm text-muted">
            Cada pilar recebe uma nota de 0 a 10. A nota final é a média ponderada dos pilares com dados (cobertura de
            indicadores: <span className="tabular text-ink">{Math.round(s.coverage * 100)}%</span>).
          </p>
          <div className="mt-6 sheet p-5">
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
              <div key={p.pillar.id} className="sheet p-5">
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

      {election && (
        <section className="border-t border-line py-12">
          <h2 className="font-display text-3xl font-bold">Mapa do voto em {election.year}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Votos válidos no 2º turno que deu origem a este mandato, estado por estado.
          </p>
          <div className="mt-6">
            <ElectionMap election={election} />
          </div>
        </section>
      )}

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
