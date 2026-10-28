"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DATA } from "@/lib/data";
import { MIN_COVERAGE, PILLARS, formatScore } from "@/lib/scoring";
import { CURRENT_TERM, TERMS, formatPeriod } from "@/lib/terms";
import { toneVar } from "@/lib/ui";
import { Grade, Stamp } from "./Grade";
import { useScores } from "./ScoreProvider";
import { WeightsPanel } from "./WeightsPanel";

export function HomeView() {
  const { scores } = useScores();
  const router = useRouter();
  const [order, setOrder] = useState<"cronologia" | "nota">("cronologia");

  const ranked = [...TERMS].sort((a, b) => (scores[b.id].score ?? -1) - (scores[a.id].score ?? -1));
  const list = order === "nota" ? ranked : TERMS;

  const cur = scores[CURRENT_TERM.id];
  const previous = TERMS.filter((t) => !t.current);
  const avgOf = (get: (id: (typeof TERMS)[number]["id"]) => number | null) => {
    const vals = previous.map((t) => get(t.id)).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const anyProvisional = TERMS.some((t) => scores[t.id].provisional);
  const filled = DATA.indicators.filter((i) => Object.keys(i.values).length > 0).length;
  const today = new Date(DATA.generatedAt + "T12:00:00").toLocaleDateString("pt-BR");

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid gap-8 pb-10 pt-12 sm:pt-16 lg:grid-cols-[1fr_16rem] lg:items-end">
        <div>
          <p className="label">Boletim dos governos federais · 2007 a 2026</p>
          <h1 className="font-display mt-3 text-6xl sm:text-8xl">Que nota cada governo tirou?</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Seis matérias, notas de 0 a 10 e a mesma régua da escola. Cada nota sai de dados oficiais do IBGE, Banco Central,
            INPE e IPEA, e cada acerto ou erro vem com a notícia que o comprova.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-4 border-t-2 border-ink pt-3 text-sm lg:grid-cols-1 lg:gap-2 lg:border-l-2 lg:border-t-0 lg:pl-4 lg:pt-0">
          <div>
            <dt className="label">Aprovado</dt>
            <dd>média 7 ou mais</dd>
          </div>
          <div>
            <dt className="label">Recuperação</dt>
            <dd>de 5 a 6,9</dd>
          </div>
          <div>
            <dt className="label">Reprovado</dt>
            <dd>abaixo de 5</dd>
          </div>
        </dl>
      </section>

      {/* O boletim */}
      <section className="sheet" aria-labelledby="boletim">
        <header className="grid gap-x-8 gap-y-2 border-b border-line px-5 py-4 text-sm sm:grid-cols-[1fr_auto_auto]">
          <div>
            <span className="label">Instituição </span>
            <span className="tabular ml-1">República Federativa do Brasil</span>
          </div>
          <div>
            <span className="label">Emitido em </span>
            <span className="tabular ml-1">{today}</span>
          </div>
          <div className="flex gap-3">
            <span className="label self-center">Ordem</span>
            {(["cronologia", "nota"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOrder(o)}
                aria-pressed={order === o}
                className={`text-sm underline-offset-4 ${order === o ? "font-bold text-pen underline decoration-2" : "text-muted hover:text-ink"}`}
              >
                {o === "nota" ? "por média" : "cronológica"}
              </button>
            ))}
          </div>
        </header>

        {/* Celular: linha compacta com média e situação à vista */}
        <ul className="md:hidden">
          {list.map((t) => {
            const s = scores[t.id];
            return (
              <li key={t.id} className={`border-b border-line ${t.current ? "bg-accent-soft/60" : ""}`}>
                <Link href={`/governo/${t.id}/`} className="block px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold">{t.label}</div>
                      <div className="tabular text-xs text-muted">
                        {formatPeriod(t)} · {t.party}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Grade score={s.score} provisional={s.provisional} />
                      <Stamp score={s.score} provisional={s.provisional} size="sm" />
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
                    {s.pillars.map((p) => (
                      <div key={p.pillar.id} className="flex justify-between gap-2">
                        <dt className="truncate text-muted">{p.pillar.short}</dt>
                        <dd>{p.score === null ? <span className="tabular text-muted">s/n</span> : <Grade score={p.score} size="sm" />}</dd>
                      </div>
                    ))}
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table id="boletim" className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="label px-5 py-3 font-semibold">Governo</th>
                {PILLARS.map((p) => (
                  <th key={p.id} className="label px-2 py-3 text-center font-semibold" title={p.description}>
                    {p.name}
                  </th>
                ))}
                <th className="label border-l-2 border-ink px-4 py-3 text-center font-semibold">Média</th>
                <th className="label px-4 py-3 text-center font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const s = scores[t.id];
                return (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/governo/${t.id}/`)}
                    className={`group cursor-pointer border-b border-line transition-colors hover:bg-surface-2 ${t.current ? "bg-accent-soft/60" : ""}`}
                  >
                    <td className="px-5 py-4">
                      <Link href={`/governo/${t.id}/`} className="font-bold group-hover:text-pen group-hover:underline">
                        {t.label}
                      </Link>
                      <div className="tabular text-xs text-muted">
                        {formatPeriod(t)} · {t.party}
                        {t.current && <span className="ml-2 font-bold text-pen">em curso</span>}
                      </div>
                    </td>
                    {s.pillars.map((p) => (
                      <td key={p.pillar.id} className="px-2 py-4 text-center">
                        {p.score === null ? (
                          <span className="tabular text-sm text-muted" title="Sem dado verificado ainda">
                            s/n
                          </span>
                        ) : (
                          <Grade score={p.score} size="sm" />
                        )}
                      </td>
                    ))}
                    <td className="border-l-2 border-ink px-4 py-4 text-center">
                      <Grade score={s.score} provisional={s.provisional} />
                      {s.provisional && <sup className="tabular text-muted">*</sup>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Stamp score={s.score} provisional={s.provisional} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="space-y-1 px-5 py-4 text-sm text-muted">
          <p>s/n = sem nota: matéria ainda sem dado oficial verificado para o período.</p>
          {anyProvisional && (
            <p>
              * Média provisória. Só {filled} de {DATA.indicators.length} séries oficiais foram verificadas até agora. Enquanto um
              governo tiver menos de {Math.round(MIN_COVERAGE * 100)}% dos indicadores, a situação fica “em apuração” e a média
              não serve para comparar governos.
            </p>
          )}
        </footer>
      </section>

      {/* Governo atual */}
      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="label">Em observação</p>
          <h2 className="font-display mt-2 text-5xl">{CURRENT_TERM.label}</h2>
          <p className="mt-3 text-muted">
            Mandato em curso, reeleito em 25/10/2026. O governo atual é medido com a mesma régua dos anteriores e comparado com
            ele mesmo.
          </p>
          <div className="mt-6 flex items-center gap-6">
            <Grade score={cur.score} provisional={cur.provisional} size="xl" />
            <Stamp score={cur.score} provisional={cur.provisional} size="lg" animate />
          </div>
          <Link href="/monitor/" className="mt-6 inline-block font-bold text-pen underline decoration-2 underline-offset-4 hover:decoration-4">
            Abrir o acompanhamento completo
          </Link>
        </div>

        <div className="sheet ruled px-5 pb-2 pt-4">
          <div className="grid grid-cols-[1fr_4.5rem_5.5rem] items-end border-b-2 border-ink pb-2">
            <span className="label">Matéria</span>
            <span className="label text-right">Atual</span>
            <span className="label text-right">Média ant.</span>
          </div>
          <ul>
            {PILLARS.map((p) => {
              const a = cur.pillars.find((x) => x.pillar.id === p.id)?.score ?? null;
              const b = avgOf((id) => scores[id].pillars.find((x) => x.pillar.id === p.id)?.score ?? null);
              return (
                <li key={p.id} className="grid h-8 grid-cols-[1fr_4.5rem_5.5rem] items-center">
                  <span>{p.name}</span>
                  <span className="text-right">
                    {a === null ? <span className="tabular text-sm text-muted">s/n</span> : <Grade score={a} size="sm" />}
                  </span>
                  <span className="tabular text-right" style={{ color: b === null ? "var(--muted)" : toneVar(b) }}>
                    {b === null ? "s/n" : formatScore(b)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Pesos */}
      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="label">Critérios de avaliação</p>
          <h2 className="font-display mt-2 text-5xl">Você decide o peso de cada matéria</h2>
          <p className="mt-3 text-muted">
            Há quem dê mais valor à economia e há quem priorize o social ou o meio ambiente. Mude os pesos e o boletim inteiro é
            recalculado na hora. A conta completa está na{" "}
            <Link href="/metodologia/" className="text-pen underline underline-offset-4">
              metodologia
            </Link>
            .
          </p>
        </div>
        <WeightsPanel />
      </section>
    </div>
  );
}
