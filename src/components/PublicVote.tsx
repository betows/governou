"use client";

import { useState } from "react";
import { formatScore } from "@/lib/scoring";
import type { TermId } from "@/lib/types";
import { toneVar } from "@/lib/ui";
import { useVotes } from "./VotesProvider";

const plural = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "voto" : "votos"}`;

/** "Que nota você daria?": voto de 0 a 10 e a média do público. */
export function PublicVote({ termId, algorithmScore }: { termId: TermId; algorithmScore: number | null }) {
  const { summary, mine, status, vote } = useVotes();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const s = summary[termId];
  const my = mine[termId];
  const max = Math.max(1, ...(s?.histogram ?? [0]));

  const choose = async (score: number) => {
    setSending(true);
    setError(await vote(termId, score));
    setSending(false);
  };

  return (
    <section className="sheet p-5 sm:p-6" aria-labelledby={`voto-${termId}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`voto-${termId}`} className="font-display text-3xl">
          Que nota você daria?
        </h2>
        <span className="text-xs text-muted">Um voto por pessoa; dá para mudar quando quiser.</span>
      </div>

      {status === "indisponivel" ? (
        <p className="mt-4 text-sm text-muted">A votação está fora do ar no momento. Tente de novo mais tarde.</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-11 gap-1" role="radiogroup" aria-label="Sua nota de 0 a 10">
            {Array.from({ length: 11 }, (_, n) => {
              const active = my === n;
              return (
                <button
                  key={n}
                  role="radio"
                  aria-checked={active}
                  disabled={sending || status === "carregando"}
                  onClick={() => choose(n)}
                  className={`tabular aspect-square rounded-[3px] border sm:aspect-auto sm:h-12 text-sm font-bold transition sm:text-base ${
                    active ? "border-ink bg-ink text-bg" : "border-line bg-bg hover:border-ink"
                  } disabled:opacity-60`}
                  style={active ? undefined : { color: toneVar(n) }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {error && (
            <p className="mt-3 text-sm text-red" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end">
            <dl className="flex gap-8">
              <div>
                <dt className="label">Público</dt>
                <dd className="tabular text-4xl font-bold" style={{ color: toneVar(s?.average ?? null) }}>
                  {formatScore(s?.average ?? null)}
                </dd>
                <dd className="text-xs text-muted">{s ? plural(s.count) : "carregando…"}</dd>
              </div>
              <div>
                <dt className="label">Algoritmo</dt>
                <dd className="tabular text-4xl font-bold" style={{ color: toneVar(algorithmScore) }}>
                  {formatScore(algorithmScore)}
                </dd>
                <dd className="text-xs text-muted">dados oficiais</dd>
              </div>
            </dl>

            {s && s.count > 0 && (
              <div aria-label="Distribuição dos votos">
                <div className="flex h-16 items-end gap-1">
                  {s.histogram.map((n, score) => (
                    <div
                      key={score}
                      className="flex-1 rounded-t-[2px]"
                      style={{ height: `${Math.max(3, (n / max) * 100)}%`, background: toneVar(score), opacity: n ? 0.85 : 0.2 }}
                      title={`Nota ${score}: ${plural(n)}`}
                    />
                  ))}
                </div>
                <div className="tabular mt-1 flex justify-between text-[10px] text-muted">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-muted">
            A nota do público é uma enquete aberta, sem valor estatístico, e não entra no cálculo da média oficial.
          </p>
        </>
      )}
    </section>
  );
}

/** Linha curta com a média do público, para as fichas. */
export function PublicScoreLine({ termId }: { termId: TermId }) {
  const { summary, status } = useVotes();
  const s = summary[termId];
  if (status !== "pronto" || !s) return null;
  return (
    <span className="text-xs text-muted">
      Público: <span className="tabular font-bold" style={{ color: toneVar(s.average) }}>{formatScore(s.average)}</span>{" "}
      · {plural(s.count)}
    </span>
  );
}
