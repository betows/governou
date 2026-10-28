/**
 * Lê, valida e consolida os arquivos de pesquisa (research/*.json).
 *
 * Regras de precisão:
 *  - todo fato e toda checagem precisam de pelo menos uma fonte com URL http(s);
 *  - datas de fatos precisam cair dentro do mandato (tolerância: 30 dias antes, 120 depois);
 *  - valores de séries oficiais baixadas da API (official-*.json) têm prioridade
 *    sobre valores levantados por busca (indicators*.json);
 *  - nada é inventado: ano sem valor verificado fica vazio.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";

export const TERMS = {
  lula2: ["2007-01-01", "2010-12-31"],
  dilma1: ["2011-01-01", "2014-12-31"],
  dilma2: ["2015-01-01", "2016-05-12"],
  temer: ["2016-05-12", "2018-12-31"],
  bolsonaro: ["2019-01-01", "2022-12-31"],
  lula3: ["2023-01-01", "2026-12-31"],
};
const IMPACTS = new Set(["positivo", "negativo", "misto"]);
const VERDICTS = new Set(["falso", "enganoso", "exagerado", "sem-contexto", "verdadeiro", "impreciso"]);

export function loadResearch(dir = new URL("../../research/", import.meta.url)) {
  const read = (f) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));
  const warnings = [];
  const warn = (m) => warnings.push(m);
  const validSources = (srcs, ctx) =>
    (srcs ?? []).filter((s) => {
      const good = typeof s?.url === "string" && /^https?:\/\/[^\s]+\.[^\s]+/.test(s.url) && s.outlet && s.title;
      if (!good) warn(`${ctx}: fonte descartada (${JSON.stringify(s)?.slice(0, 120)})`);
      return good;
    });

  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : [];

  // ---------- Indicadores ----------
  const indicators = new Map();
  const mergeIndicators = (list, origin) => {
    for (const ind of list ?? []) {
      const values = {};
      const origins = {};
      const yearSources = {};
      for (const [y, v] of Object.entries(ind.values ?? {})) {
        if (typeof v !== "number" || !Number.isFinite(v)) continue;
        values[y] = v;
        origins[y] = origin;
        const src = ind.yearSources?.[y] ?? ind.sourceUrl;
        if (src) yearSources[y] = src;
      }
      const prev = indicators.get(ind.id);
      if (!prev) {
        indicators.set(ind.id, {
          id: ind.id,
          name: ind.name,
          unit: ind.unit,
          higherIsBetter: Boolean(ind.higherIsBetter),
          officialSource: ind.officialSource ?? "",
          sourceUrl: ind.sourceUrl ?? "",
          notes: ind.notes ?? "",
          values,
          origins,
          yearSources,
        });
        continue;
      }
      // Arquivos lidos depois sobrescrevem os anteriores; a API oficial sobrescreve tudo
      // e nenhum valor de pesquisa sobrescreve um valor da API.
      for (const y of Object.keys(values)) {
        if (prev.origins[y] === "api" && origin !== "api") continue;
        prev.values[y] = values[y];
        prev.origins[y] = origin;
        if (yearSources[y]) prev.yearSources[y] = yearSources[y];
      }
      if (!prev.sourceUrl && ind.sourceUrl) prev.sourceUrl = ind.sourceUrl;
      if (ind.notes && !prev.notes.includes(ind.notes)) prev.notes = [prev.notes, ind.notes].filter(Boolean).join(" ");
      if (origin === "api") prev.officialSource = `${ind.officialSource} (API oficial)`;
    }
  };
  for (const f of files.filter((f) => f.startsWith("indicators"))) mergeIndicators(read(f).indicators, "pesquisa");
  for (const f of files.filter((f) => f.startsWith("official-"))) mergeIndicators(read(f).indicators, "api");

  // ---------- Fatos de governo ----------
  const events = [];
  const seen = new Set();
  for (const f of files.filter((f) => f.startsWith("events-"))) {
    const { termId, events: list } = read(f);
    if (!TERMS[termId]) { warn(`${f}: termId desconhecido ${termId}`); continue; }
    const [start, end] = TERMS[termId].map((d) => new Date(d).getTime());
    for (const e of list ?? []) {
      const ctx = `${f}#${e.id}`;
      if (!e.id || seen.has(e.id)) { warn(`${ctx}: id ausente ou duplicado`); continue; }
      if (!IMPACTS.has(e.impact)) { warn(`${ctx}: impacto inválido ${e.impact}`); continue; }
      const t = new Date(e.date).getTime();
      // Resultados anuais costumam ser divulgados até ~3 meses após o fim do mandato.
      if (!(t >= start - 30 * 864e5 && t <= end + 120 * 864e5)) { warn(`${ctx}: data ${e.date} fora do mandato`); continue; }
      const sources = validSources(e.sources, ctx);
      if (sources.length === 0) { warn(`${ctx}: sem fonte válida — descartado`); continue; }
      seen.add(e.id);
      events.push({ ...e, termId, weight: [1, 2, 3].includes(e.weight) ? e.weight : 1, sources, status: e.status ?? "pendente" });
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));

  // ---------- Checagens ----------
  const factchecks = [];
  if (files.includes("factchecks.json")) {
    for (const c of read("factchecks.json").factchecks ?? []) {
      const ctx = `factchecks#${c.id}`;
      if (!VERDICTS.has(c.verdict)) { warn(`${ctx}: veredito inválido ${c.verdict}`); continue; }
      const about = (c.about ?? []).filter((t) => TERMS[t]);
      const sources = validSources(c.sources, ctx);
      if (sources.length === 0) { warn(`${ctx}: sem fonte válida — descartado`); continue; }
      factchecks.push({ ...c, about, sources, status: c.status ?? "pendente" });
    }
  }
  factchecks.sort((a, b) => b.date.localeCompare(a.date));

  return {
    dataset: { generatedAt: new Date().toISOString().slice(0, 10), indicators: [...indicators.values()], events, factchecks },
    warnings,
  };
}
