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
  /** Título reconstruído do link ou data estimada: precisa de conferência. */
  approx?: boolean;
}

/** 'pendente' = levantado por pesquisa, aguardando revisão humana. */
export type ReviewStatus = "pendente" | "revisado";

export type PersonId = "lula" | "dilma" | "temer" | "bolsonaro";

export interface Term {
  id: TermId;
  person: PersonId;
  /** Ano da eleição que deu o mandato (2º turno); null quando assumiu sem eleição própria. */
  electionYear: number | null;
  /** Como chegou ao cargo, em uma frase. */
  howTookOffice: string;
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
  /** Origem de cada valor: API oficial ou pesquisa em publicação citada. */
  origins?: Record<string, "api" | "pesquisa">;
  reviewed?: Record<string, boolean>;
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
  status?: ReviewStatus;
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
  status?: ReviewStatus;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
}

/** 2º turno por UF: % dos votos válidos de cada candidato. */
export interface Election {
  year: number;
  round: number;
  winner: string;
  candidates: Candidate[];
  national: Record<string, number>;
  nationalSource: string;
  notes: string;
  states: Record<string, { shares: Record<string, number>; source: string }>;
}

export interface Bio {
  id: string;
  fullName: string;
  birthDate?: string;
  birthPlace: string;
  profession: string;
  previousOffices: string[];
  sources: Source[];
}

export interface Portrait {
  src: string;
  author: string;
  license: string;
  sourceUrl: string;
}

export interface Dataset {
  generatedAt: string;
  indicators: IndicatorSeries[];
  events: GovEvent[];
  factchecks: FactCheck[];
  elections: Election[];
  bios: Bio[];
}
