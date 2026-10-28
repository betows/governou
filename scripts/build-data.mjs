#!/usr/bin/env node
/**
 * Gera src/data/dataset.json, que o app usa no build.
 *  - Com DATABASE_URL: lê do banco Neon (fonte oficial em produção).
 *  - Sem DATABASE_URL: consolida os arquivos de research/ (desenvolvimento local).
 */
import { writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { pullDataset } from "./lib/db.mjs";
import { loadResearch } from "./lib/research.mjs";

const out = new URL("../src/data/dataset.json", import.meta.url);
let dataset;

if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  dataset = await pullDataset((text) => sql.query(text));
  console.log("Fonte: banco Neon");
} else {
  const res = loadResearch();
  dataset = res.dataset;
  console.log("Fonte: arquivos em research/ (defina DATABASE_URL para ler do banco)");
  if (res.warnings.length) {
    console.log(`${res.warnings.length} aviso(s):`);
    for (const w of res.warnings) console.log("  - " + w);
  }
}

writeFileSync(out, JSON.stringify(dataset, null, 2) + "\n");
const filled = dataset.indicators.filter((i) => Object.keys(i.values).length > 0).length;
console.log(`Indicadores: ${filled}/${dataset.indicators.length} com dados | Fatos: ${dataset.events.length} | Checagens: ${dataset.factchecks.length}`);
