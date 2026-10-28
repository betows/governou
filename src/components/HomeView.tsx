"use client";

import Link from "next/link";
import { useState } from "react";
import { DATA, series } from "@/lib/data";
import { formatScore, gradeLabel } from "@/lib/scoring";
import { CURRENT_TERM, TERMS } from "@/lib/terms";
import { toneVar } from "@/lib/ui";
import { GradeRing } from "./GradeRing";
import { Sparkline } from "./Sparkline";
import { useScores } from "./ScoreProvider";
import { TermCard } from "./TermCard";
import { WeightsPanel } from "./WeightsPanel";

export function HomeView() {
  const { scores } = useScores();
  const [order, setOrder] = useState<"cronologia" | "nota">("cronologia");

  const ranked = [...TERMS].sort((a, b) => (scores[b.id].score ?? -1) - (scores[a.id].score ?? -1));
  const rankOf = Object.fromEntries(ranked.map((t, i) => [t.id, i + 1]));
  const list = order === "nota" ? ranked : TERMS;

  const cur = scores[CURRENT_TERM.id];
  const others = TERMS.filter((t) => !t.current && scores[t.id].score !== null);
  const avg = others.length ? others.reduce((a, t) => a + scores[t.id].score!, 0) / others.length : null;

  const anyProvisional = TERMS.some((t) => scores[t.id].provisional);
  const filledIndicators = DATA.indicators.filter((i) => Object.keys(i.values).length > 0).length;
  const pib = series("pib");
  const pibLast = pib ? Math.max(...Object.keys(pib.values).map(Number)) : null;

  return (
    <>
      <section className="relative border-b border-line">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-great shadow-[0_0_8px_var(--great)]" />
              20 anos · 6 mandatos · dados oficiais
            </p>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] sm:text-7xl">
              Quanto vale
              <br />
              cada <span className="text-gradient">governo</span>?
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Notas de 0 a 10 calculadas por um algoritmo público a partir de dados do IBGE, Banco Central, INPE e IPEA —
              com os acertos, os erros e as fontes de cada número. Sem torcida.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link
                href="/monitor/"
                className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-3 font-semibold text-bg shadow-[0_0_30px_-5px_rgba(34,211,238,0.6)] transition hover:brightness-110"
              >
                Monitorar o governo atual →
              </Link>
              <Link href="/metodologia/" className="rounded-xl border border-line bg-surface/60 px-5 py-3 font-medium transition hover:border-accent hover:text-accent">
                Como a nota é feita
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                [String(DATA.events.length), "fatos com fonte"],
                [String(DATA.factchecks.length), "checagens"],
                [`${filledIndicators}/${DATA.indicators.length}`, "séries oficiais"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="tabular text-2xl font-semibold text-ink">{v}</dt>
                  <dd className="mt-1 text-xs text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Link href="/monitor/" className="rise glass lit block overflow-hidden rounded-2xl" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-awful/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-mid/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-great/70" />
                <span className="ml-2 hidden sm:inline">monitor://governo-atual</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-great">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-great" /> ao vivo
              </span>
            </div>
            <div className="flex items-center gap-6 p-6">
              <GradeRing score={cur.score} size={160} stroke={9} provisional={cur.provisional} />
              <div className="min-w-0">
                <div className="text-xl font-semibold">{CURRENT_TERM.label}</div>
                <div className="text-sm text-muted">2023–hoje · reeleito em 25/10/2026</div>
                <div className="mt-4 font-mono text-xs uppercase tracking-wider text-muted">Média dos 5 anteriores</div>
                <div className="tabular text-2xl font-semibold" style={{ color: anyProvisional ? "var(--muted)" : toneVar(avg) }}>
                  {formatScore(avg)}
                </div>
                {cur.score !== null && avg !== null && !anyProvisional && (
                  <div className={`tabular mt-1 text-sm ${cur.score >= avg ? "text-great" : "text-awful"}`}>
                    {cur.score >= avg ? "▲" : "▼"} {formatScore(Math.abs(cur.score - avg))} vs. média
                  </div>
                )}
              </div>
            </div>
            {pib && (
              <div className="border-t border-line px-6 pb-5 pt-4">
                <div className="flex justify-between font-mono text-[11px] uppercase tracking-wider text-muted">
                  <span>PIB real · % a.a. · IBGE</span>
                  <span>2006–{pibLast}</span>
                </div>
                <div className="mt-2 text-accent">
                  <Sparkline values={pib.values} highlight={CURRENT_TERM.years} height={56} />
                </div>
              </div>
            )}
          </Link>
        </div>
      </section>

      {anyProvisional && (
        <div className="mx-auto mt-8 max-w-6xl px-4">
          <div className="flex gap-3 rounded-xl border border-mid/30 bg-mid/5 p-4 text-sm">
            <span className="font-mono text-mid">!</span>
            <p>
              <strong className="text-mid">Base em construção:</strong> {filledIndicators} de {DATA.indicators.length} séries oficiais já foram
              verificadas. Enquanto a cobertura de um mandato estiver abaixo de 60%, a nota aparece como{" "}
              <strong>prévia</strong> (cinza) e não deve ser usada para comparar governos.
            </p>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-bold">Os governos</h2>
            <p className="mt-1 text-muted">Clique em um cartão para ver de onde vem cada décimo da nota.</p>
          </div>
          <div className="flex rounded-full border border-line bg-surface p-1 text-sm">
            {(["cronologia", "nota"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOrder(o)}
                className={`rounded-full px-4 py-1.5 capitalize transition ${order === o ? "bg-accent text-bg font-semibold" : "text-muted hover:text-ink"}`}
              >
                {o === "nota" ? "Ranking" : "Cronologia"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => (
            <TermCard key={t.id} term={t} index={i} rank={order === "nota" ? rankOf[t.id] : undefined} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-6 px-4 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-4xl font-bold">Discorda dos pesos?</h2>
          <p className="mt-3 text-muted">
            Cada pessoa valoriza coisas diferentes. Aqui você decide quanto importa economia, contas públicas, área social,
            meio ambiente, segurança e os fatos de governo — e vê o ranking mudar em tempo real.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {ranked.map((t, i) => (
              <li key={t.id} className="flex items-center justify-between border-b border-line py-2">
                <span>
                  <span className="tabular mr-3 text-muted">{i + 1}.</span>
                  {t.label}
                </span>
                <span className="tabular font-semibold" style={{ color: toneVar(scores[t.id].score) }}>
                  {formatScore(scores[t.id].score)}{" "}
                  <span className="text-xs font-normal text-muted">
                    {scores[t.id].provisional ? "prévia" : gradeLabel(scores[t.id].score).label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <WeightsPanel />
      </section>
    </>
  );
}
