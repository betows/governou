"use client";

import Link from "next/link";
import { useState } from "react";
import { DATA } from "@/lib/data";
import { formatScore, gradeLabel } from "@/lib/scoring";
import { CURRENT_TERM, TERMS } from "@/lib/terms";
import { toneVar } from "@/lib/ui";
import { GradeRing } from "./GradeRing";
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

  return (
    <>
      <section className="grain border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-14 sm:pt-20 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div className="rise">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">20 anos · 6 mandatos · dados oficiais</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight sm:text-7xl">
              Quanto vale cada <em className="text-accent">governo</em>?
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Notas de 0 a 10 calculadas por um algoritmo público a partir de dados do IBGE, Banco Central, INPE e IPEA —
              com os acertos, os erros e as fontes de cada número. Sem torcida.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link href="/monitor/" className="rounded-full bg-ink px-5 py-2.5 font-medium text-bg transition hover:opacity-85">
                Monitorar o governo atual
              </Link>
              <Link href="/metodologia/" className="rounded-full border border-line bg-surface px-5 py-2.5 font-medium transition hover:border-accent">
                Como a nota é feita
              </Link>
            </div>
          </div>

          <Link
            href="/monitor/"
            className="rise rounded-3xl border border-line bg-surface p-6 transition hover:border-accent"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              <span>Governo atual</span>
              <span className="inline-flex items-center gap-1.5 text-accent">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> ao vivo
              </span>
            </div>
            <div className="mt-4 flex items-center gap-6">
              <GradeRing score={cur.score} size={128} stroke={10} provisional={cur.provisional} />
              <div>
                <div className="text-xl font-semibold">{CURRENT_TERM.label}</div>
                <div className="text-sm text-muted">2023–hoje · reeleito em 25/10/2026</div>
                <div className="mt-3 text-sm">
                  Média dos 5 mandatos anteriores:{" "}
                  <span className="tabular font-semibold" style={{ color: toneVar(avg) }}>
                    {formatScore(avg)}
                  </span>
                </div>
                {cur.score !== null && avg !== null && !anyProvisional && (
                  <div className="mt-1 text-sm text-muted">
                    {cur.score >= avg ? "Acima" : "Abaixo"} da média por{" "}
                    <span className="tabular font-medium text-ink">{formatScore(Math.abs(cur.score - avg))}</span> ponto
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>
      </section>

      {anyProvisional && (
        <div className="mx-auto mt-8 max-w-6xl px-4">
          <div className="rounded-2xl border border-[color-mix(in_oklab,var(--mid)_45%,transparent)] bg-[color-mix(in_oklab,var(--mid)_10%,transparent)] p-4 text-sm">
            <strong>Base em construção:</strong> {filledIndicators} de {DATA.indicators.length} séries oficiais já foram verificadas.
            Enquanto a cobertura de um mandato estiver abaixo de 60%, a nota aparece como <strong>prévia</strong> (cinza) e não deve
            ser usada para comparar governos.
          </div>
        </div>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-4xl tracking-tight">Os governos</h2>
            <p className="mt-1 text-muted">Clique em um cartão para ver de onde vem cada décimo da nota.</p>
          </div>
          <div className="flex rounded-full border border-line bg-surface p-1 text-sm">
            {(["cronologia", "nota"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOrder(o)}
                className={`rounded-full px-4 py-1.5 capitalize transition ${order === o ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
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
          <h2 className="font-serif text-4xl tracking-tight">Discorda dos pesos?</h2>
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
