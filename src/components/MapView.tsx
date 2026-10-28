"use client";

import { useState } from "react";
import { DATA } from "@/lib/data";
import { TERMS } from "@/lib/terms";
import { ElectionMap } from "./ElectionMap";

export function MapView() {
  const elections = DATA.elections ?? [];
  const [year, setYear] = useState(elections[elections.length - 1]?.year);
  const election = elections.find((e) => e.year === year);
  const termFor = (y: number) => TERMS.find((t) => t.electionYear === y);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="label">Mapa do voto</p>
      <h1 className="font-display mt-2 text-6xl">Onde cada presidente teve apoio</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Resultado do 2º turno em cada estado, nas eleições que levaram cada presidente ao cargo. Apoio aqui é voto válido,
        não aprovação de governo.
      </p>

      {elections.length === 0 ? (
        <p className="sheet mt-10 p-6 text-muted">Os resultados por estado ainda estão sendo verificados.</p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Eleição">
            {elections.map((e) => {
              const winner = e.candidates.find((c) => c.id === e.winner);
              return (
                <button
                  key={e.year}
                  role="tab"
                  aria-selected={e.year === year}
                  onClick={() => setYear(e.year)}
                  className={`rounded-[3px] border px-3 py-2 text-left text-sm transition ${e.year === year ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink"}`}
                >
                  <span className="tabular block font-bold">{e.year}</span>
                  <span className={e.year === year ? "opacity-80" : "text-muted"}>{winner?.name}</span>
                </button>
              );
            })}
          </div>
          {election && (
            <section className="mt-8">
              {election.year === 2026 ? (
                <p className="mb-4 text-sm text-muted">Reeleição de Lula para o mandato 2027–2030.</p>
              ) : (
                termFor(election.year) && <p className="mb-4 text-sm text-muted">Deu origem ao mandato {termFor(election.year)!.label}.</p>
              )}
              <ElectionMap key={election.year} election={election} />
            </section>
          )}
          <p className="mt-10 text-xs text-muted">
            Temer não aparece porque não foi eleito presidente: assumiu como vice eleito na chapa de 2014. Contorno dos estados:
            svg-maps/brazil (CC BY 4.0).
          </p>
        </>
      )}
    </div>
  );
}
