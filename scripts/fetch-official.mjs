#!/usr/bin/env node
/**
 * Baixa séries oficiais direto da API SGS do Banco Central e grava
 * research/official-bcb.json, que tem prioridade sobre os valores levantados por busca.
 *
 * Requer acesso de rede a api.bcb.gov.br. Uso: npm run data:fetch
 *
 * Os códigos SGS podem ser conferidos em https://www3.bcb.gov.br/sgspub
 */
import { writeFileSync } from "node:fs";

const START = "01/01/2006";
const END = `31/12/${new Date().getFullYear()}`;

const SERIES = {
  selic: { code: 432, name: "Meta Selic (fim de ano)", unit: "% a.a.", reduce: "last" },
  ipca: { code: 433, name: "IPCA acumulado no ano", unit: "%", reduce: "compound" },
  cambio: { code: 1, name: "Dólar (venda) – fim de ano", unit: "R$/US$", reduce: "last" },
  divida_bruta: { code: 13762, name: "Dívida bruta do governo geral (% PIB)", unit: "% do PIB", reduce: "december" },
  // NFSP primário acumulado em 12 meses: positivo = déficit. Invertemos o sinal (positivo = superávit).
  resultado_primario: { code: 5793, name: "Resultado primário – setor público consolidado", unit: "% do PIB", reduce: "december", invert: true },
  desemprego: { code: 24369, name: "Taxa de desocupação – PNAD Contínua (média do ano)", unit: "%", reduce: "mean", minYear: 2012 },
};

async function fetchSeries(code) {
  // A API SGS limita consultas diárias a 10 anos por requisição.
  const out = [];
  const startYear = 2006;
  const endYear = new Date().getFullYear();
  for (let y = startYear; y <= endYear; y += 10) {
    const from = y === startYear ? START : `01/01/${y}`;
    const to = Math.min(y + 9, endYear) === endYear ? END : `31/12/${y + 9}`;
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${from}&dataFinal=${to}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`SGS ${code}: HTTP ${res.status}`);
    out.push(...(await res.json()));
  }
  return out.map((r) => {
    const [d, m, y] = r.data.split("/").map(Number);
    return { y, m, d, v: Number(r.valor.replace(",", ".")) };
  });
}

function reduceYear(rows, how) {
  if (rows.length === 0) return undefined;
  switch (how) {
    case "last":
      return rows[rows.length - 1].v;
    case "december": {
      const dec = rows.filter((r) => r.m === 12);
      return dec.length ? dec[dec.length - 1].v : undefined;
    }
    case "mean":
      return rows.reduce((a, r) => a + r.v, 0) / rows.length;
    case "compound": {
      if (rows.length < 12) return undefined; // ano incompleto
      return (rows.reduce((a, r) => a * (1 + r.v / 100), 1) - 1) * 100;
    }
  }
}

const indicators = [];
for (const [id, cfg] of Object.entries(SERIES)) {
  try {
    const rows = await fetchSeries(cfg.code);
    const values = {};
    const years = [...new Set(rows.map((r) => r.y))];
    for (const y of years) {
      if (cfg.minYear && y < cfg.minYear) continue;
      let v = reduceYear(rows.filter((r) => r.y === y), cfg.reduce);
      if (v === undefined) continue;
      if (cfg.invert) v = -v;
      values[y] = Math.round(v * 100) / 100;
    }
    indicators.push({
      id,
      name: cfg.name,
      unit: cfg.unit,
      officialSource: `Banco Central do Brasil – SGS ${cfg.code}`,
      sourceUrl: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${cfg.code}/dados?formato=json`,
      values,
    });
    console.log(`✔ ${id} (SGS ${cfg.code}): ${Object.keys(values).length} anos`);
  } catch (err) {
    console.error(`✘ ${id}: ${err.message}`);
  }
}

writeFileSync(
  new URL("../research/official-bcb.json", import.meta.url),
  JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), indicators }, null, 2),
);
console.log("Gravado research/official-bcb.json — rode `npm run data:build` em seguida.");
