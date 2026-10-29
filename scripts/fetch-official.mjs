#!/usr/bin/env node
/**
 * Baixa séries oficiais direto da API SGS do Banco Central e grava
 * research/official-bcb.json, que tem prioridade sobre os valores levantados por busca.
 *
 * Validação: cada série baixada é comparada com os valores já verificados em research/
 * nos anos em comum. Se a diferença típica passar da tolerância (código SGS errado,
 * conceito diferente, sinal invertido), a série é descartada e o motivo vai para o log.
 *
 * Roda no build da Vercel (que tem acesso a api.bcb.gov.br) ou com npm run data:fetch.
 * Os códigos SGS podem ser conferidos em https://www3.bcb.gov.br/sgspub
 */
import { writeFileSync } from "node:fs";
import { loadResearch } from "./lib/research.mjs";

const START_YEAR = 2006;

// tol: diferença mediana aceitável frente aos valores verificados (mesma unidade da série)
const SERIES = {
  selic: { code: 432, name: "Meta Selic (fim de ano)", unit: "% a.a.", reduce: "last", tol: 0.05 },
  ipca: { code: 433, name: "IPCA acumulado no ano", unit: "%", reduce: "compound", tol: 0.05 },
  cambio: { code: 1, name: "Dólar (venda) – fim de ano", unit: "R$/US$", reduce: "last", tol: 0.03 },
  divida_bruta: { code: 13762, name: "Dívida bruta do governo geral (% PIB)", unit: "% do PIB", reduce: "december", tol: 1.5 },
  // NFSP primário acumulado em 12 meses: positivo = déficit. Invertemos o sinal (positivo = superávit).
  resultado_primario: { code: 5793, name: "Resultado primário – setor público consolidado", unit: "% do PIB", reduce: "december", invert: true, tol: 0.3 },
  desemprego: { code: 24369, name: "Taxa de desocupação – PNAD Contínua (média do ano)", unit: "%", reduce: "mean", minYear: 2012, tol: 0.3 },
};

async function getJson(url) {
  // A API do BCB oscila (502, lentidão): até 3 tentativas com espera crescente.
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(45000) });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error(`resposta inesperada: ${text.slice(0, 160)}`);
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw lastError;
}

async function fetchSeries(code, startYear = START_YEAR) {
  // A API SGS limita o intervalo por consulta; janelas de 5 anos evitam respostas lentas nas séries diárias.
  const out = [];
  const endYear = new Date().getFullYear();
  for (let y = startYear; y <= endYear; y += 5) {
    const last = Math.min(y + 4, endYear);
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=01/01/${y}&dataFinal=31/12/${last}`;
    try {
      out.push(...(await getJson(url)));
    } catch (err) {
      throw new Error(`SGS ${code} ${y}–${last}: ${err.message}`);
    }
  }
  return out.map((r) => {
    const [d, m, y] = r.data.split("/").map(Number);
    return { y, m, d, v: Number(String(r.valor).replace(",", ".")) };
  });
}

function reduceYear(rows, how) {
  if (rows.length === 0) return undefined;
  switch (how) {
    case "last":
      // só anos fechados: exige dado de dezembro
      return rows.some((r) => r.m === 12) ? rows[rows.length - 1].v : undefined;
    case "december": {
      const dec = rows.filter((r) => r.m === 12);
      return dec.length ? dec[dec.length - 1].v : undefined;
    }
    case "mean":
      return rows.length >= 12 ? rows.reduce((a, r) => a + r.v, 0) / rows.length : undefined;
    case "compound":
      return rows.length >= 12 ? (rows.reduce((a, r) => a * (1 + r.v / 100), 1) - 1) * 100 : undefined;
  }
}

function annual(rows, cfg, sign) {
  const values = {};
  for (const y of [...new Set(rows.map((r) => r.y))]) {
    if (cfg.minYear && y < cfg.minYear) continue;
    const v = reduceYear(rows.filter((r) => r.y === y), cfg.reduce);
    if (v !== undefined && Number.isFinite(v)) values[y] = Math.round(sign * v * 100) / 100;
  }
  return values;
}

/** Diferença mediana absoluta nos anos em comum com a pesquisa verificada. */
function compare(values, reference) {
  const years = Object.keys(values).filter((y) => reference?.[y] !== undefined);
  if (years.length < 3) return { years: years.length, median: null };
  const diffs = years.map((y) => Math.abs(values[y] - reference[y])).sort((a, b) => a - b);
  return { years: years.length, median: diffs[Math.floor(diffs.length / 2)] };
}

if (!process.env.VERCEL && process.env.npm_lifecycle_event !== "data:fetch") {
  console.log("Séries do BCB: pulado fora da Vercel (use npm run data:fetch).");
  process.exit(0);
}

// Referência: só valores de pesquisa (não os de uma execução anterior da própria API).
const { dataset } = loadResearch();
const reference = Object.fromEntries(
  dataset.indicators.map((i) => [
    i.id,
    Object.fromEntries(Object.entries(i.values).filter(([y]) => i.origins?.[y] !== "api")),
  ]),
);

const indicators = [];
for (const [id, cfg] of Object.entries(SERIES)) {
  try {
    // Séries que começam depois de 2006 (ex.: PNAD Contínua em 2012) dão 404 em janelas anteriores.
    const rows = await fetchSeries(cfg.code, cfg.minYear ?? START_YEAR);
    const expected = cfg.invert ? -1 : 1;
    let values = annual(rows, cfg, expected);
    let check = compare(values, reference[id]);
    if (check.median !== null && check.median > cfg.tol) {
      // Tenta o sinal oposto antes de desistir (convenção de sinal diferente da esperada).
      const flipped = annual(rows, cfg, -expected);
      const checkFlipped = compare(flipped, reference[id]);
      if (checkFlipped.median !== null && checkFlipped.median <= cfg.tol) {
        console.warn(`  ${id}: sinal invertido em relação ao esperado; usando o sinal que bate com a pesquisa`);
        values = flipped;
        check = checkFlipped;
      }
    }
    if (check.median === null) {
      console.warn(`✘ ${id} (SGS ${cfg.code}): só ${check.years} ano(s) em comum com a pesquisa — sem como validar, descartado`);
      continue;
    }
    if (check.median > cfg.tol) {
      console.warn(`✘ ${id} (SGS ${cfg.code}): diferença mediana ${check.median.toFixed(2)} > tolerância ${cfg.tol} — descartado`);
      continue;
    }
    indicators.push({
      id,
      name: cfg.name,
      unit: cfg.unit,
      officialSource: `Banco Central do Brasil – SGS ${cfg.code}`,
      sourceUrl: `https://www3.bcb.gov.br/sgspub/consultarvalores/telaCvsSelecionarSeries.paint?codigoSerie=${cfg.code}`,
      values,
    });
    console.log(
      `✔ ${id} (SGS ${cfg.code}): ${Object.keys(values).length} anos; validado em ${check.years} anos (diferença mediana ${check.median.toFixed(2)})`,
    );
  } catch (err) {
    console.warn(`✘ ${id}: ${err.message}`);
  }
}

writeFileSync(
  new URL("../research/official-bcb.json", import.meta.url),
  JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), indicators }, null, 2) + "\n",
);
console.log(`Séries do BCB: ${indicators.length} de ${Object.keys(SERIES).length} validadas.`);
