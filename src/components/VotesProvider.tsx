"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { TermId } from "@/lib/types";
import type { VoteSummary } from "@/lib/votes";

interface Ctx {
  summary: Partial<Record<TermId, VoteSummary>>;
  mine: Partial<Record<TermId, number>>;
  status: "carregando" | "pronto" | "indisponivel";
  vote: (termId: TermId, score: number) => Promise<string | null>;
}

const VotesContext = createContext<Ctx | null>(null);

const index = (list: VoteSummary[]) => Object.fromEntries(list.map((s) => [s.termId, s])) as Ctx["summary"];

export function VotesProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<Ctx["summary"]>({});
  const [mine, setMine] = useState<Ctx["mine"]>({});
  const [status, setStatus] = useState<Ctx["status"]>("carregando");

  useEffect(() => {
    fetch("/api/votos/")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        setSummary(index(d.summary));
        setMine(d.mine ?? {});
        setStatus("pronto");
      })
      .catch(() => setStatus("indisponivel"));
  }, []);

  /** Devolve null em caso de sucesso ou a mensagem de erro. */
  const vote = useCallback(async (termId: TermId, score: number) => {
    const before = mine[termId];
    setMine((m) => ({ ...m, [termId]: score }));
    try {
      const r = await fetch("/api/votos/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ termId, score }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Não foi possível registrar o voto.");
      setSummary(index(d.summary));
      setMine(d.mine ?? {});
      return null;
    } catch (err) {
      setMine((m) => ({ ...m, [termId]: before }));
      return err instanceof Error ? err.message : "Não foi possível registrar o voto.";
    }
  }, [mine]);

  return <VotesContext.Provider value={{ summary, mine, status, vote }}>{children}</VotesContext.Provider>;
}

export function useVotes() {
  const ctx = useContext(VotesContext);
  if (!ctx) throw new Error("useVotes fora do VotesProvider");
  return ctx;
}
