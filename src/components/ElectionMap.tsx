"use client";

import brazilMap from "@svg-maps/brazil";
import { useState } from "react";
import type { Election } from "@/lib/types";

// Contorno dos estados: svg-maps/brazil (CC BY 4.0). O pacote não traz os tipos.
const brazil = brazilMap as unknown as { viewBox: string; locations: { id: string; name: string; path: string }[] };
const NAME_BY_UF = Object.fromEntries(brazil.locations.map((l) => [l.id.toUpperCase(), l.name]));
const pct = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/** Intensidade da cor: 50% = clara, 75% ou mais = cheia. */
function fill(color: string, share: number) {
  const t = Math.min(1, Math.max(0, (share - 50) / 25));
  return `color-mix(in oklab, ${color} ${Math.round(28 + 72 * t)}%, var(--fill))`;
}

export function ElectionMap({ election, compact = false }: { election: Election; compact?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const a = election.candidates.find((c) => c.id === election.winner)!;
  const b = election.candidates.find((c) => c.id !== election.winner)!;
  const color = { [a.id]: "var(--vote-a)", [b.id]: "var(--vote-b)" };

  const leaderOf = (uf: string) => {
    const s = election.states[uf]?.shares;
    if (!s) return null;
    return s[a.id] >= s[b.id] ? a.id : b.id;
  };
  const ufs = Object.keys(election.states);
  const wonBy = (id: string) => ufs.filter((uf) => leaderOf(uf) === id);
  const missing = 27 - ufs.length;

  const focus = active ? election.states[active] : undefined;
  const shares = focus?.shares ?? election.national;

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[1.3fr_1fr]"}`}>
      <div className="relative">
        <svg viewBox={brazil.viewBox} className="h-auto w-full" role="img" aria-label={`Mapa do 2º turno de ${election.year} por estado`}>
          <defs>
            <pattern id={`sem-dado-${election.year}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--fill)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--rule)" strokeWidth="2" />
            </pattern>
          </defs>
          {brazil.locations.map((loc) => {
            const uf = loc.id.toUpperCase();
            const st = election.states[uf];
            const leader = leaderOf(uf);
            return (
              <path
                key={uf}
                d={loc.path}
                className={`uf-shape ${active === uf ? "active" : ""}`}
                fill={st && leader ? fill(color[leader], st.shares[leader]) : `url(#sem-dado-${election.year})`}
                tabIndex={0}
                role="button"
                aria-label={`${loc.name}: ${st ? `${a.name} ${pct(st.shares[a.id])}, ${b.name} ${pct(st.shares[b.id])}` : "sem dado"}`}
                onMouseEnter={() => setActive(uf)}
                onFocus={() => setActive(uf)}
                onClick={() => setActive(uf)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex flex-col gap-4">
        <div className="sheet p-4">
          <div className="label">{active ? `${NAME_BY_UF[active]} (${active})` : `Brasil · 2º turno de ${election.year}`}</div>
          {active && !focus ? (
            <p className="mt-2 text-sm text-muted">Sem dado verificado para este estado.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {[a, b].map((c) => (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 font-bold">
                      <span className="h-3 w-3 rounded-[2px]" style={{ background: color[c.id] }} aria-hidden />
                      {c.name} <span className="font-normal text-muted">({c.party})</span>
                    </span>
                    <span className="tabular text-lg">{shares[c.id] !== undefined ? pct(shares[c.id]) : "—"}</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-surface-2">
                    <div className="h-full" style={{ width: `${shares[c.id] ?? 0}%`, background: color[c.id] }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {(focus?.source || (!active && election.nationalSource)) && (
            <a
              href={focus?.source ?? election.nationalSource}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-muted underline underline-offset-2 hover:text-pen"
            >
              Fonte do dado ↗
            </a>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[a, b].map((c) => (
            <div key={c.id} className="border-t-2 pt-2" style={{ borderColor: color[c.id] }}>
              <dt className="text-muted">{c.name} venceu em</dt>
              <dd>
                <span className="tabular text-2xl font-bold">{wonBy(c.id).filter((uf) => uf !== "DF").length}</span> estados
                {wonBy(c.id).includes("DF") && " + DF"}
              </dd>
            </div>
          ))}
        </dl>

        <div className="text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>50%</span>
            <span className="h-2 flex-1" style={{ background: `linear-gradient(90deg, ${fill("var(--vote-a)", 50)}, ${fill("var(--vote-a)", 75)})` }} />
            <span>75%+</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span>50%</span>
            <span className="h-2 flex-1" style={{ background: `linear-gradient(90deg, ${fill("var(--vote-b)", 50)}, ${fill("var(--vote-b)", 75)})` }} />
            <span>75%+</span>
          </div>
          <p className="mt-2">
            Cor = quem teve mais votos válidos no estado; quanto mais forte, maior a vantagem.
            {missing > 0 && ` ${missing} estado(s) hachurado(s) ainda sem dado verificado.`}
          </p>
        </div>
      </div>

      {!compact && (
        <details className="lg:col-span-2">
          <summary className="cursor-pointer text-sm font-bold text-pen">Ver a tabela por estado</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm">
              <thead>
                <tr className="border-b-2 border-ink text-left">
                  <th className="label py-2">Estado</th>
                  <th className="label py-2 text-right">{a.name}</th>
                  <th className="label py-2 text-right">{b.name}</th>
                  <th className="label py-2 text-right">Fonte</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {brazil.locations
                  .map((l) => l.id.toUpperCase())
                  .sort()
                  .map((uf) => {
                    const st = election.states[uf];
                    return (
                      <tr key={uf} className="border-b border-line">
                        <td className="py-1.5">{uf}</td>
                        <td className="py-1.5 text-right">{st ? pct(st.shares[a.id]) : "—"}</td>
                        <td className="py-1.5 text-right">{st ? pct(st.shares[b.id]) : "—"}</td>
                        <td className="py-1.5 text-right">
                          {st?.source ? (
                            <a href={st.source} target="_blank" rel="noopener noreferrer" className="text-pen underline">
                              ↗
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
