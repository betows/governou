export type TermId = "lula2" | "dilma1" | "dilma2" | "temer" | "bolsonaro" | "lula3";

export type Area =
  | "economia"
  | "fiscal"
  | "social"
  | "saude"
  | "educacao"
  | "meio-ambiente"
  | "seguranca"
  | "institucional"
  | "infraestrutura"
  | "relacoes-exteriores"
  | "corrupcao"
  | "eleicoes";

export interface Source {
  outlet: string;
  title: string;
  url: string;
  date?: string;
}

export interface Term {
  id: TermId;
  president: string;
  shortName: string;
  label: string;
  party: string;
  vice: string;
  start: string;
  end: string;
  /** Anos civis atribuídos ao mandato (o ano vai para quem governou a maior parte dele). */
  years: number[];
  current?: boolean;
  note?: string;
}

export interface IndicatorSeries {
  id: string;
  name: string;
  unit: string;
  higherIsBetter: boolean;
  officialSource: string;
  sourceUrl: string;
  values: Record<string, number>;
  notes?: string;
  yearSources?: Record<string, string>;
}

export type Impact = "positivo" | "negativo" | "misto";

export interface GovEvent {
  id: string;
  termId: TermId;
  date: string;
  title: string;
  summary: string;
  impact: Impact;
  area: Area;
  weight: 1 | 2 | 3;
  evidence: string;
  sources: Source[];
}

export type Verdict = "falso" | "enganoso" | "exagerado" | "sem-contexto" | "verdadeiro" | "impreciso";

export interface FactCheck {
  id: string;
  claim: string;
  claimant: string;
  about: TermId[];
  date: string;
  verdict: Verdict;
  /** Data da checagem estimada (não confirmada na página original). */
  dateApprox?: boolean;
  explanation: string;
  topic: Area;
  sources: Source[];
}

export interface Dataset {
  generatedAt: string;
  indicators: IndicatorSeries[];
  events: GovEvent[];
  factchecks: FactCheck[];
}
