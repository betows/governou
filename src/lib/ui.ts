import type { Area, Impact, Verdict } from "./types";
import { gradeLabel } from "./scoring";

export const toneVar = (score: number | null) => `var(--${gradeLabel(score).tone})`;

export const AREA_LABEL: Record<Area, string> = {
  economia: "Economia",
  fiscal: "Fiscal",
  social: "Social",
  saude: "Saúde",
  educacao: "Educação",
  "meio-ambiente": "Meio ambiente",
  seguranca: "Segurança",
  institucional: "Institucional",
  infraestrutura: "Infraestrutura",
  "relacoes-exteriores": "Relações exteriores",
  corrupcao: "Corrupção",
  eleicoes: "Eleições",
};

export const IMPACT_META: Record<Impact, { label: string; color: string; sign: string }> = {
  positivo: { label: "Acerto", color: "var(--great)", sign: "+" },
  negativo: { label: "Erro", color: "var(--awful)", sign: "−" },
  misto: { label: "Controverso", color: "var(--mid)", sign: "±" },
};

export const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  falso: { label: "Falso", color: "var(--awful)" },
  enganoso: { label: "Enganoso", color: "var(--bad)" },
  exagerado: { label: "Exagerado", color: "var(--mid)" },
  "sem-contexto": { label: "Sem contexto", color: "var(--mid)" },
  impreciso: { label: "Impreciso", color: "var(--mid)" },
  verdadeiro: { label: "Verdadeiro", color: "var(--great)" },
};

export const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, day || 1)).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};
