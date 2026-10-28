"use client";

import { DEFAULT_OPTIONS, PILLARS } from "@/lib/scoring";
import { useScores } from "./ScoreProvider";

export function WeightsPanel() {
  const { options, setOptions, isDefault } = useScores();
  const total = PILLARS.reduce((a, p) => a + options.weights[p.id], 0) || 1;

  return (
    <div className="sheet p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Monte sua própria régua</h3>
        {!isDefault && (
          <button onClick={() => setOptions(DEFAULT_OPTIONS)} className="text-xs font-medium text-accent hover:underline">
            Restaurar padrão
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">Mude o peso de cada pilar; todas as notas são recalculadas na hora.</p>

      <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <label key={p.id} className="block">
            <span className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{p.name}</span>
              <span className="tabular text-muted">{Math.round((options.weights[p.id] / total) * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={options.weights[p.id]}
              onChange={(e) => setOptions({ ...options, weights: { ...options.weights, [p.id]: Number(e.target.value) } })}
              className="mt-2 w-full accent-[var(--accent)]"
              aria-label={`Peso de ${p.name}`}
            />
          </label>
        ))}
      </div>

      <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
        <Toggle
          checked={options.globalContext}
          onChange={(v) => setOptions({ ...options, globalContext: v })}
          title="Descontar o cenário mundial"
          desc="Compara o PIB do Brasil com o PIB mundial (FMI). Crises globais como 2009 e 2020 pesam menos."
        />
        <Toggle
          checked={options.lag}
          onChange={(v) => setOptions({ ...options, lag: v })}
          title="Defasagem de 1 ano"
          desc="Atribui a cada governo os resultados do ano seguinte, já que políticas demoram a fazer efeito."
        />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 rounded-xl p-2 text-left transition hover:bg-surface-2"
    >
      <span className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${checked ? "bg-accent" : "bg-line"}`}>
        <span className={`h-4 w-4 rounded-full bg-surface transition ${checked ? "translate-x-4" : ""}`} />
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </button>
  );
}
