#!/usr/bin/env node
/**
 * Valida e consolida os arquivos de pesquisa (research/*.json) em src/data/dataset.json.
 *
 * Regras de precisão:
 *  - todo fato e toda checagem precisam de pelo menos uma fonte com URL http(s);
 *  - datas de fatos precisam cair dentro do mandato (tolerância: 30 dias antes, 120 depois);
 *  - valores de séries oficiais baixadas da API (official-*.json) têm prioridade
 *    sobre valores levantados por busca;
 *  - nada é inventado: ano sem valor verificado fica vazio.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const dir = new URL("research/", root);
const read = (f) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));

const TERMS = {
  lula2: ["2007-01-01", "2010-12-31"],
  dilma1: ["2011-01-01", "2014-12-31"],
  dilma2: ["2015-01-01", "2016-05-12"],
  temer: ["2016-05-12", "2018-12-31"],
  bolsonaro: ["2019-01-01", "2022-12-31"],
  lula3: ["2023-01-01", "2026-12-31"],
};
const IMPACTS = new Set(["positivo", "negativo", "misto"]);
const VERDICTS = new Set(["falso", "enganoso", "exagerado", "sem-contexto", "verdadeiro", "impreciso"]);

const warnings = [];
const warn = (m) => warnings.push(m);
const validSources = (srcs, ctx) => {
  const ok = (srcs ?? []).filter((s) => {
    const good = typeof s?.url === "string" && /^https?:\/\/[^\s]+\.[^\s]+/.test(s.url) && s.outlet && s.title;
    if (!good) warn(`${ctx}: fonte descartada (${JSON.stringify(s)?.slice(0, 120)})`);
    return good;
  });
  return ok;
};

const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : [];

// ---------- Indicadores ----------
const indicators = new Map();
const mergeIndicators = (list, priority) => {
  for (const ind of list ?? []) {
    const values = {};
    for (const [y, v] of Object.entries(ind.values ?? {})) {
      if (typeof v === "number" && Number.isFinite(v)) values[y] = v;
    }
    const prev = indicators.get(ind.id);
    if (!prev) {
      indicators.set(ind.id, { ...ind, values, sourceUrl: ind.sourceUrl ?? "" });
    } else {
      // valores de maior prioridade sobrescrevem; metadados são complementados
      prev.values = priority ? { ...prev.values, ...values } : { ...values, ...prev.values };
      if (priority) {
        prev.officialSource = `${ind.officialSource} (API oficial)`;
        prev.sourceUrl = ind.sourceUrl || prev.sourceUrl;
      }
    }
  }
};
if (files.includes("indicators.json")) mergeIndicators(read("indicators.json").indicators, false);
for (const f of files.filter((f) => f.startsWith("official-"))) mergeIndicators(read(f).indicators, true);

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
    events.push({ ...e, termId, weight: [1, 2, 3].includes(e.weight) ? e.weight : 1, sources });
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
    factchecks.push({ ...c, about, sources });
  }
}
factchecks.sort((a, b) => b.date.localeCompare(a.date));

const dataset = {
  generatedAt: new Date().toISOString().slice(0, 10),
  indicators: [...indicators.values()],
  events,
  factchecks,
};
writeFileSync(new URL("src/data/dataset.json", root), JSON.stringify(dataset, null, 2) + "\n");

const filled = dataset.indicators.filter((i) => Object.keys(i.values).length > 0).length;
console.log(`Indicadores: ${filled}/${dataset.indicators.length} com dados`);
console.log(`Fatos: ${events.length} | Checagens: ${factchecks.length}`);
if (warnings.length) {
  console.log(`\n${warnings.length} aviso(s):`);
  for (const w of warnings) console.log("  - " + w);
}
