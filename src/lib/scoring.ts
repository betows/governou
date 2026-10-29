import type { Dataset, GovEvent, IndicatorSeries, Term } from "./types";

/**
 * Algoritmo de nota — totalmente determinístico e auditável.
 *
 * 1. Para cada indicador oficial calcula-se o "valor do mandato" (média anual, variação
 *    em pontos ou variação percentual entre o ano anterior à posse e o último ano).
 * 2. O valor é convertido em nota 0–10 por interpolação linear entre uma faixa de
 *    referência fixa (pior → 0, melhor → 10). Faixas fixas evitam que a nota de um
 *    governo mude quando outro governo entra na comparação.
 * 3. Nota do pilar = média ponderada das notas dos indicadores disponíveis.
 * 4. Nota final = média ponderada dos pilares (pesos ajustáveis pelo usuário).
 */

export type PillarId = "economia" | "fiscal" | "social" | "saude" | "educacao" | "ambiente" | "seguranca" | "gestao";

export interface Pillar {
  id: PillarId;
  name: string;
  short: string;
  description: string;
  defaultWeight: number;
}

export const PILLARS: Pillar[] = [
  { id: "economia", name: "Economia", short: "Econ.", description: "Crescimento, emprego, inflação e investimento.", defaultWeight: 20 },
  { id: "fiscal", name: "Contas públicas", short: "Fiscal", description: "Trajetória da dívida e resultado primário.", defaultWeight: 15 },
  { id: "social", name: "Social", short: "Social", description: "Pobreza extrema, desigualdade e salário mínimo real.", defaultWeight: 20 },
  { id: "saude", name: "Saúde", short: "Saúde", description: "Mortalidade infantil.", defaultWeight: 10 },
  { id: "educacao", name: "Educação", short: "Educ.", description: "Qualidade do ensino fundamental medida pelo IDEB.", defaultWeight: 10 },
  { id: "ambiente", name: "Meio ambiente", short: "Amb.", description: "Desmatamento na Amazônia (PRODES/INPE).", defaultWeight: 10 },
  { id: "seguranca", name: "Segurança", short: "Seg.", description: "Evolução da taxa de homicídios.", defaultWeight: 10 },
  { id: "gestao", name: "Fatos de governo", short: "Fatos", description: "Balanço dos principais acertos e erros documentados pela imprensa e por órgãos oficiais.", defaultWeight: 5 },
];

export type Aggregation = "media" | "variacao" | "variacao_pct";

export interface IndicatorRule {
  id: string;
  /** Série usada quando o ajuste de contexto global está ligado. */
  contextId?: string;
  pillar: PillarId;
  label: string;
  aggregation: Aggregation;
  /** Valor que recebe nota 0 e valor que recebe nota 10. */
  worst: number;
  best: number;
  weight: number;
  unit: string;
  why: string;
  /** Séries alternativas, em ordem de preferência, quando a principal não cobre o período. */
  fallbacks?: string[];
  /** Série publicada a cada dois anos (ex.: IDEB): a janela aceita a edição vizinha. */
  biennial?: boolean;
}

export const RULES: IndicatorRule[] = [
  {
    id: "pib",
    pillar: "economia",
    label: "Crescimento do PIB",
    aggregation: "media",
    worst: -2,
    best: 5,
    weight: 1.2,
    unit: "% a.a.",
    why: "Média do crescimento real anual. Com o ajuste de contexto ligado, usa-se a diferença entre o PIB do Brasil e o PIB mundial (FMI) — descontando crises globais como 2009 e 2020.",
  },
  {
    id: "desemprego",
    pillar: "economia",
    label: "Desemprego",
    aggregation: "variacao",
    worst: 4,
    best: -3,
    weight: 1,
    unit: "p.p.",
    fallbacks: ["desemprego_pme"],
    why: "Variação da taxa de desocupação entre o ano anterior à posse e o fim do mandato. Usa-se a variação, e não o nível, porque a PNAD Contínua só existe a partir de 2012 (antes: PME, metodologia diferente).",
  },
  {
    id: "ipca",
    pillar: "economia",
    label: "Inflação (IPCA)",
    aggregation: "media",
    worst: 10,
    best: 3,
    weight: 1,
    unit: "% a.a.",
    why: "Média da inflação anual. 3% (perto do centro da meta) recebe nota máxima; 10% ou mais recebe zero.",
  },
  {
    id: "taxa_investimento",
    pillar: "economia",
    label: "Taxa de investimento",
    aggregation: "media",
    worst: 15,
    best: 22,
    weight: 0.6,
    unit: "% do PIB",
    why: "Média da formação bruta de capital fixo (máquinas, obras, infraestrutura) em relação ao PIB. Investimento alto sustenta o crescimento futuro.",
  },
  {
    id: "divida_bruta",
    pillar: "fiscal",
    label: "Dívida bruta (DBGG)",
    aggregation: "variacao",
    worst: 15,
    best: -10,
    weight: 1,
    unit: "p.p. do PIB",
    why: "Quanto a dívida bruta do governo geral subiu ou caiu, em pontos do PIB, durante o mandato.",
  },
  {
    id: "resultado_primario",
    pillar: "fiscal",
    label: "Resultado primário",
    aggregation: "media",
    worst: -4,
    best: 3,
    weight: 1,
    unit: "% do PIB",
    why: "Média do resultado primário do setor público consolidado (positivo = superávit).",
  },
  {
    id: "pobreza_extrema",
    pillar: "social",
    label: "Pobreza extrema",
    aggregation: "variacao",
    worst: 3,
    best: -4,
    weight: 1.2,
    unit: "p.p.",
    why: "Variação da parcela da população em extrema pobreza durante o mandato.",
  },
  {
    id: "gini",
    pillar: "social",
    label: "Desigualdade (Gini)",
    aggregation: "variacao",
    worst: 0.03,
    best: -0.04,
    weight: 1,
    unit: "pontos",
    why: "Variação do índice de Gini da renda domiciliar per capita (queda = menos desigualdade).",
  },
  {
    id: "salario_minimo_real",
    pillar: "social",
    label: "Salário mínimo real",
    aggregation: "media",
    worst: -2,
    best: 6,
    weight: 0.8,
    unit: "% a.a.",
    why: "Ganho real médio anual do salário mínimo (acima da inflação).",
  },
  {
    id: "mortalidade_infantil",
    pillar: "saude",
    label: "Mortalidade infantil",
    aggregation: "variacao_pct",
    worst: 5,
    best: -20,
    weight: 1.2,
    unit: "%",
    fallbacks: ["mortalidade_infantil_censo2022"],
    why: "Variação percentual das mortes de menores de 1 ano por mil nascidos vivos durante o mandato. A partir de 2022 o IBGE usa a base do Censo 2022; as duas séries nunca são comparadas entre si.",
  },
  {
    id: "ideb_iniciais",
    pillar: "educacao",
    label: "IDEB – anos iniciais",
    aggregation: "variacao",
    worst: -0.3,
    best: 0.6,
    weight: 1,
    unit: "pontos",
    biennial: true,
    why: "Variação do IDEB dos anos iniciais do ensino fundamental (INEP), entre a edição anterior ao mandato e a última do mandato.",
  },
  {
    id: "ideb_finais",
    pillar: "educacao",
    label: "IDEB – anos finais",
    aggregation: "variacao",
    worst: -0.3,
    best: 0.4,
    weight: 1,
    unit: "pontos",
    biennial: true,
    why: "Variação do IDEB dos anos finais do ensino fundamental (INEP), entre a edição anterior ao mandato e a última do mandato.",
  },
  {
    id: "desmatamento",
    pillar: "ambiente",
    label: "Desmatamento na Amazônia",
    aggregation: "media",
    worst: 15000,
    best: 4000,
    weight: 1,
    unit: "km²/ano",
    why: "Média anual da área desmatada medida pelo PRODES/INPE.",
  },
  {
    id: "homicidios",
    pillar: "seguranca",
    label: "Taxa de homicídios",
    aggregation: "variacao_pct",
    worst: 20,
    best: -25,
    weight: 1,
    unit: "%",
    why: "Variação percentual da taxa de homicídios por 100 mil habitantes durante o mandato.",
  },
];

/** Fração mínima de anos do mandato com dado para calcular uma média. */
export const MIN_YEARS_SHARE = 0.75;

export const CONTEXT_SERIES = { pib: "pib_mundo" } as const;

export interface ScoreOptions {
  weights: Record<PillarId, number>;
  /** Desconta o ciclo econômico mundial do crescimento do PIB. */
  globalContext: boolean;
  /** Atribui a cada governo os resultados do ano seguinte (políticas têm efeito defasado). */
  lag: boolean;
}

export const DEFAULT_OPTIONS: ScoreOptions = {
  weights: Object.fromEntries(PILLARS.map((p) => [p.id, p.defaultWeight])) as Record<PillarId, number>,
  globalContext: false,
  lag: false,
};

export interface IndicatorResult {
  rule: IndicatorRule;
  series?: IndicatorSeries;
  value: number | null;
  score: number | null;
  yearsUsed: number[];
  baselineYear?: number;
  explanation: string;
  partial: boolean;
}

export interface PillarResult {
  pillar: Pillar;
  score: number | null;
  indicators: IndicatorResult[];
}

export interface TermScore {
  termId: Term["id"];
  score: number | null;
  pillars: PillarResult[];
  coverage: number;
  /** Cobertura de dados insuficiente: a nota é exibida apenas como prévia. */
  provisional: boolean;
}

/** Fração mínima de indicadores com dado para a nota deixar de ser prévia. */
export const MIN_COVERAGE = 0.6;

const clamp = (v: number, lo = 0, hi = 10) => Math.min(hi, Math.max(lo, v));
export const round1 = (v: number) => Math.round(v * 10) / 10;

export function toScore(value: number, worst: number, best: number) {
  return clamp(((value - worst) / (best - worst)) * 10);
}

function seriesValue(s: IndicatorSeries | undefined, year: number): number | undefined {
  const v = s?.values[String(year)];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

const fmtNum = (v: number, digits = 1) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function scoreIndicator(rule: IndicatorRule, term: Term, data: Dataset, opts: ScoreOptions): IndicatorResult {
  const byId = (id: string) => data.indicators.find((i) => i.id === id);
  const years = term.years.map((y) => (opts.lag ? y + 1 : y));
  const useContext = opts.globalContext && rule.id === "pib";
  const world = useContext ? byId(CONTEXT_SERIES.pib) : undefined;
  const candidates = [rule.id, ...(rule.fallbacks ?? [])].map(byId).filter(Boolean) as IndicatorSeries[];
  if (candidates.length === 0) {
    return { rule, value: null, score: null, yearsUsed: [], explanation: "Série ainda não disponível no conjunto de dados.", partial: true };
  }
  // Usa a primeira série (principal ou alternativa) que cubra o mandato; nunca mistura séries.
  let fallback: IndicatorResult | undefined;
  for (const series of candidates) {
    const r = scoreWithSeries(rule, term, series, years, useContext ? world : undefined);
    if (r.score !== null) return r;
    fallback ??= r;
  }
  return fallback!;
}

function scoreWithSeries(
  rule: IndicatorRule,
  term: Term,
  series: IndicatorSeries,
  years: number[],
  world: IndicatorSeries | undefined,
): IndicatorResult {
  const useContext = world !== undefined;
  const valueAt = (y: number) => {
    const v = seriesValue(series, y);
    if (v === undefined) return undefined;
    if (!useContext) return v;
    const w = seriesValue(world, y);
    return w === undefined ? undefined : v - w;
  };

  const empty = (explanation: string): IndicatorResult => ({
    rule, series, value: null, score: null, yearsUsed: [], explanation, partial: true,
  });

  const available = years.filter((y) => valueAt(y) !== undefined);
  if (available.length === 0) return empty("Sem dado oficial para os anos deste mandato.");

  let partial = available.length < years.length;
  let value: number;
  let windowYears = 4;
  let baselineYear: number | undefined;
  let explanation: string;
  const span = available.length > 1 ? `${available[0]}–${available[available.length - 1]}` : `${available[0]}`;
  const unit = useContext ? "p.p. vs. mundo" : rule.unit;

  if (rule.aggregation === "media") {
    // Média só vale se cobrir ao menos 75% dos anos do mandato.
    const needed = Math.ceil(years.length * MIN_YEARS_SHARE);
    if (available.length < needed)
      return empty(`Só ${available.length} de ${years.length} anos com dado oficial (${span}); mínimo de ${needed} para calcular a média.`);
    value = available.reduce((a, y) => a + valueAt(y)!, 0) / available.length;
    const digits = Math.abs(value) >= 1000 ? 0 : 1;
    explanation = `Média de ${fmtNum(value, digits)} ${unit} em ${span}`;
  } else {
    // Variação só vale numa janela que represente o mandato inteiro: começa no ano
    // anterior à posse (ou no primeiro ano) e termina no último ano do mandato.
    // No mandato em curso aceita-se o último dado publicado (até 2 anos de defasagem).
    const first = years[0];
    const lastYear = years[years.length - 1];
    const lag = (term.current ? 2 : 0) + (rule.biennial ? 1 : 0);
    const starts = rule.biennial ? [first - 1, first - 2, first] : [first - 1, first];
    baselineYear = starts.find((y) => valueAt(y) !== undefined);
    const last = Array.from({ length: lag + 1 }, (_, k) => lastYear - k).find((y) => valueAt(y) !== undefined);
    if (baselineYear === undefined || last === undefined || last <= baselineYear) {
      const have = [first - 1, ...years].filter((y) => valueAt(y) !== undefined);
      return empty(
        `Faltam dados no início ou no fim do mandato para medir a variação${have.length ? ` (há dado só para ${have.join(", ")})` : ""}.`,
      );
    }
    if (last < lastYear) partial = true;
    const base = valueAt(baselineYear)!;
    const end = valueAt(last)!;
    if (rule.aggregation === "variacao_pct") {
      value = ((end - base) / base) * 100;
      explanation = `De ${fmtNum(base)} (${baselineYear}) para ${fmtNum(end)} (${last}): ${value >= 0 ? "+" : ""}${fmtNum(value)}%`;
    } else {
      value = end - base;
      const digits = Math.abs(value) < 0.1 ? 3 : 1;
      explanation = `De ${fmtNum(base, digits === 3 ? 3 : 1)} (${baselineYear}) para ${fmtNum(end, digits === 3 ? 3 : 1)} (${last}): ${value >= 0 ? "+" : ""}${fmtNum(value, digits)} ${unit}`;
    }
    // Janelas de tamanhos diferentes (mandato de 1 a 4 anos, dado com defasagem) só são
    // comparáveis por ano: a variação vira ritmo anual e a faixa (pensada para 4 anos) também.
    windowYears = last - baselineYear;
    if (windowYears !== 4) {
      const perYear = value / windowYears;
      const digits = Math.abs(perYear) < 0.1 ? 3 : 1;
      explanation += ` em ${windowYears} ${windowYears === 1 ? "ano" : "anos"} (${perYear >= 0 ? "+" : ""}${fmtNum(perYear, digits)} por ano)`;
    }
  }

  const scale = rule.aggregation === "media" ? 1 : windowYears / 4;
  const [worst, best] = useContext ? [-4, 2] : [rule.worst * scale, rule.best * scale];
  const score = toScore(value, worst, best);
  return {
    rule,
    series,
    value,
    score,
    yearsUsed: available,
    baselineYear,
    explanation: series.id !== rule.id ? `${explanation} (série ${series.name})` : explanation,
    partial,
  };
}

/** Abaixo disso o levantamento é considerado incompleto e o pilar "Fatos" não entra na nota. */
export const MIN_EVENTS = 12;

export function eventsBalance(events: GovEvent[]) {
  let pos = 0;
  let neg = 0;
  let mixed = 0;
  for (const e of events) {
    if (e.impact === "positivo") pos += e.weight;
    else if (e.impact === "negativo") neg += e.weight;
    else mixed += e.weight;
  }
  const total = pos + neg + mixed;
  // Fatos "mistos" contam no denominador mas não puxam para nenhum lado.
  const score = events.length < MIN_EVENTS ? null : clamp(5 + (5 * (pos - neg)) / total);
  return { pos, neg, mixed, score, count: events.length };
}

export function scoreTerm(term: Term, data: Dataset, opts: ScoreOptions = DEFAULT_OPTIONS): TermScore {
  const pillars: PillarResult[] = PILLARS.map((pillar) => {
    if (pillar.id === "gestao") {
      const evs = data.events.filter((e) => e.termId === term.id);
      const b = eventsBalance(evs);
      return { pillar, score: b.score, indicators: [] };
    }
    const indicators = RULES.filter((r) => r.pillar === pillar.id).map((r) => scoreIndicator(r, term, data, opts));
    const valid = indicators.filter((i) => i.score !== null);
    const wsum = valid.reduce((a, i) => a + i.rule.weight, 0);
    const score = wsum === 0 ? null : valid.reduce((a, i) => a + i.score! * i.rule.weight, 0) / wsum;
    return { pillar, score, indicators };
  });

  const scored = pillars.filter((p) => p.score !== null && opts.weights[p.pillar.id] > 0);
  const wTotal = scored.reduce((a, p) => a + opts.weights[p.pillar.id], 0);
  const score = wTotal === 0 ? null : scored.reduce((a, p) => a + p.score! * opts.weights[p.pillar.id], 0) / wTotal;

  const allInd = pillars.flatMap((p) => p.indicators);
  const coverage = allInd.length === 0 ? 0 : allInd.filter((i) => i.score !== null).length / allInd.length;

  return { termId: term.id, score, pillars, coverage, provisional: coverage < MIN_COVERAGE };
}

export function gradeLabel(score: number | null) {
  if (score === null) return { label: "Sem nota", tone: "none" as const };
  if (score >= 8.5) return { label: "Excelente", tone: "great" as const };
  if (score >= 7) return { label: "Bom", tone: "good" as const };
  if (score >= 5) return { label: "Regular", tone: "mid" as const };
  if (score >= 3) return { label: "Ruim", tone: "bad" as const };
  return { label: "Crítico", tone: "awful" as const };
}

/** Situação final no boletim, com a régua da escola: média 7 aprova, abaixo de 5 reprova. */
export function situation(score: number | null, provisional: boolean) {
  if (score === null || provisional) return { label: "Em apuração", tone: "none" as const };
  if (score >= 7) return { label: "Aprovado", tone: "good" as const };
  if (score >= 5) return { label: "Recuperação", tone: "mid" as const };
  return { label: "Reprovado", tone: "awful" as const };
}

export const formatScore = (v: number | null) => (v === null ? "—" : fmtNum(round1(v)));
