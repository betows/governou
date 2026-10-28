"use client";

import { useMemo, useState } from "react";
import { DATA } from "@/lib/data";
import { TERMS } from "@/lib/terms";
import type { TermId, Verdict } from "@/lib/types";
import { VERDICT_META } from "@/lib/ui";
import { FactCheckList } from "./FactCheckList";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function FactCheckView() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState<TermId | "todos">("todos");
  const [verdict, setVerdict] = useState<Verdict | "todos">("todos");

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return DATA.factchecks.filter(
      (c) =>
        (term === "todos" || c.about.includes(term)) &&
        (verdict === "todos" || c.verdict === verdict) &&
        (!nq || norm(`${c.claim} ${c.explanation} ${c.claimant}`).includes(nq)),
    );
  }, [q, term, verdict]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Desmentindo boatos</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Checagem</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Declarações e boatos sobre os governos, verificados por agências profissionais de checagem (Lupa, Aos Fatos,
        Comprova, AFP, Estadão Verifica, g1 Fato ou Fake, UOL Confere). Vale para todos os lados.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busque um boato: “taxação do Pix”, “vacina”, “dívida”…"
          className="flex-1 rounded-full border border-line bg-surface px-5 py-3 text-sm outline-none focus:border-accent"
          aria-label="Buscar checagem"
        />
        <select value={term} onChange={(e) => setTerm(e.target.value as TermId | "todos")} className="rounded-full border border-line bg-surface px-4 py-3 text-sm" aria-label="Governo">
          <option value="todos">Todos os governos</option>
          {TERMS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <select value={verdict} onChange={(e) => setVerdict(e.target.value as Verdict | "todos")} className="rounded-full border border-line bg-surface px-4 py-3 text-sm" aria-label="Veredito">
          <option value="todos">Todos os vereditos</option>
          {Object.entries(VERDICT_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-6 text-sm text-muted">
        {list.length} {list.length === 1 ? "checagem" : "checagens"}
      </p>
      <div className="mt-4">
        {DATA.factchecks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            As checagens estão sendo levantadas. Só publicamos itens com link para a agência que fez a verificação.
          </p>
        ) : (
          <FactCheckList checks={list} />
        )}
      </div>
    </div>
  );
}
