#!/usr/bin/env node
/**
 * Testa o caminho completo do banco sem precisar do Neon: aplica db/schema.sql
 * num Postgres em memória (PGlite), carrega research/ e lê de volta.
 * Uso: npm run db:test
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pullDataset, seedStatements, splitSql } from "./lib/db.mjs";
import { loadResearch } from "./lib/research.mjs";

const db = new PGlite();
for (const s of splitSql(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"))) await db.query(s);

const { dataset } = loadResearch();
const stmts = seedStatements(dataset);
for (const s of stmts) await db.query(s);
// Carga repetida não pode duplicar nada.
for (const s of stmts) await db.query(s);

const back = await pullDataset(async (q) => (await db.query(q)).rows);

const fail = [];
const check = (cond, msg) => cond || fail.push(msg);
check(back.indicators.length === dataset.indicators.length, "número de indicadores");
check(back.events.length === dataset.events.length, "número de fatos");
check(back.factchecks.length === dataset.factchecks.length, "número de checagens");
check(back.elections.length === dataset.elections.length, "número de eleições");
for (const el of dataset.elections) {
  const b = back.elections.find((x) => x.year === el.year);
  for (const [uf, st] of Object.entries(el.states)) {
    for (const [cand, v] of Object.entries(st.shares)) check(b?.states[uf]?.shares[cand] === v, `eleição ${el.year}/${uf}/${cand}`);
  }
}
check(back.bios.length === dataset.bios.length, "número de fichas");
for (const i of dataset.indicators) {
  const b = back.indicators.find((x) => x.id === i.id);
  for (const [y, v] of Object.entries(i.values)) check(b?.values[y] === v, `valor ${i.id}/${y}`);
}
for (const e of dataset.events) {
  const b = back.events.find((x) => x.id === e.id);
  check(b && b.date === e.date && b.impact === e.impact, `fato ${e.id}`);
  check(b && b.sources.length === new Set(e.sources.map((s) => s.url)).size, `fontes de ${e.id}`);
}

// Linha revisada não é sobrescrita por pesquisa.
const ev = dataset.events[0];
await db.query(`update gov_event set status = 'revisado', title = 'TITULO REVISADO' where id = $1`, [ev.id]);
for (const s of stmts) await db.query(s);
const kept = (await db.query(`select title from gov_event where id = $1`, [ev.id])).rows[0].title;
check(kept === "TITULO REVISADO", "revisão humana preservada");

if (fail.length) {
  console.error("FALHOU:\n  " + fail.slice(0, 20).join("\n  "));
  process.exit(1);
}
console.log(`OK: ${stmts.length} comandos, ${back.indicators.length} indicadores, ${back.events.length} fatos, ${back.factchecks.length} checagens; idempotente; revisão preservada.`);
