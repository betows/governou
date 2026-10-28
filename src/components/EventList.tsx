"use client";

import { useState } from "react";
import type { GovEvent, Impact } from "@/lib/types";
import { AREA_LABEL, IMPACT_META, fmtDate } from "@/lib/ui";
import { Sources } from "./Sources";

export function EventList({ events }: { events: GovEvent[] }) {
  const [filter, setFilter] = useState<Impact | "todos">("todos");
  const shown = filter === "todos" ? events : events.filter((e) => e.impact === filter);
  const count = (i: Impact) => events.filter((e) => e.impact === i).length;

  if (events.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
        Os fatos deste mandato ainda estão em levantamento. Só publicamos fatos com fonte verificável.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-sm">
        {(["todos", "positivo", "negativo", "misto"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-[3px] border px-3 py-1 transition ${filter === f ? "border-ink bg-ink text-bg font-semibold" : "border-line bg-surface text-muted hover:text-ink"}`}
          >
            {f === "todos" ? `Todos · ${events.length}` : `${IMPACT_META[f].label}s · ${count(f)}`}
          </button>
        ))}
      </div>
      <ol className="relative mt-6 space-y-4 border-l border-line pl-6">
        {shown.map((e) => {
          const m = IMPACT_META[e.impact];
          return (
            <li key={e.id} className="relative">
              <span
                className="absolute -left-[33px] top-4 grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold text-white"
                style={{ background: m.color }}
                aria-hidden
              >
                {m.sign}
              </span>
              <article className="sheet p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-semibold uppercase tracking-wider" style={{ color: m.color }}>
                    {m.label}
                  </span>
                  <span className="text-muted">{fmtDate(e.date)}</span>
                  <span className="rounded-[3px] bg-surface-2 px-2 py-0.5 text-muted">{AREA_LABEL[e.area] ?? e.area}</span>
                  <span className="text-muted" title="Peso do fato no pilar 'Fatos de governo'">
                    {"●".repeat(e.weight)}
                    <span className="opacity-30">{"●".repeat(3 - e.weight)}</span>
                  </span>
                </div>
                <h4 className="mt-2 text-lg font-semibold leading-snug">{e.title}</h4>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{e.summary}</p>
                {e.evidence && (
                  <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                    <span className="font-semibold">Dado-chave: </span>
                    {e.evidence}
                  </p>
                )}
                <div className="mt-3">
                  <Sources sources={e.sources} />
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
