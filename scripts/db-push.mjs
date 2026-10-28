#!/usr/bin/env node
/**
 * Envia os arquivos de research/ para o banco Neon (upsert).
 *  - Sempre grava db/seed.sql com os comandos gerados.
 *  - Com DATABASE_URL, aplica o esquema e os comandos direto no banco.
 * Linhas marcadas como 'revisado' no banco não são sobrescritas por pesquisa.
 * Uso: npm run db:push
 */
import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { seedStatements, splitSql } from "./lib/db.mjs";
import { loadResearch } from "./lib/research.mjs";

const { dataset, warnings } = loadResearch();
for (const w of warnings) console.log("aviso: " + w);
const statements = seedStatements(dataset);
writeFileSync(new URL("../db/seed.sql", import.meta.url), statements.join(";\n") + ";\n");
console.log(`db/seed.sql: ${statements.length} comandos`);

if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  for (const stmt of splitSql(schema)) await sql.query(stmt);
  await sql.transaction(statements.map((s) => sql.query(s)));
  console.log("Banco atualizado.");
}
