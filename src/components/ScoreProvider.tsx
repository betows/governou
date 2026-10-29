"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DATA } from "@/lib/data";
import { DEFAULT_OPTIONS, scoreTerm, type ScoreOptions, type TermScore } from "@/lib/scoring";
import { TERMS } from "@/lib/terms";
import type { TermId } from "@/lib/types";

interface Ctx {
  options: ScoreOptions;
  setOptions: (o: ScoreOptions) => void;
  scores: Record<TermId, TermScore>;
  isDefault: boolean;
}

const ScoreContext = createContext<Ctx | null>(null);
// v2: novas matérias (saúde e educação) e novos pesos padrão
const KEY = "gv:options:v2";

export function ScoreProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptionsState] = useState<ScoreOptions>(DEFAULT_OPTIONS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ScoreOptions;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrata preferências salvas após a montagem
        setOptionsState({ ...DEFAULT_OPTIONS, ...parsed, weights: { ...DEFAULT_OPTIONS.weights, ...parsed.weights } });
      }
    } catch {
      /* armazenamento indisponível: segue com o padrão */
    }
  }, []);

  const setOptions = (o: ScoreOptions) => {
    setOptionsState(o);
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch {
      /* ignora */
    }
  };

  const scores = useMemo(
    () => Object.fromEntries(TERMS.map((t) => [t.id, scoreTerm(t, DATA, options)])) as Record<TermId, TermScore>,
    [options],
  );

  const isDefault = JSON.stringify(options) === JSON.stringify(DEFAULT_OPTIONS);

  return <ScoreContext.Provider value={{ options, setOptions, scores, isDefault }}>{children}</ScoreContext.Provider>;
}

export function useScores() {
  const ctx = useContext(ScoreContext);
  if (!ctx) throw new Error("useScores fora do ScoreProvider");
  return ctx;
}
