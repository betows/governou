/**
 * Testa a lógica da nota do público num Postgres em memória (PGlite).
 * Uso: npm run votes:test
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { MAX_VOTES_PER_HOUR, castVote, myVotes, parseVote, summarize, type Query } from "../src/lib/votes";
import { splitSql } from "./lib/db.mjs";

const db = new PGlite();
for (const s of splitSql(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"))) await db.query(s);
const query: Query = async (text, params) => (await db.query(text, params ?? [])).rows as Record<string, unknown>[];

const fail: string[] = [];
const check = (cond: boolean, msg: string) => cond || fail.push(msg);

check(parseVote({ termId: "lula3", score: 7 }) !== null, "voto válido aceito");
check(parseVote({ termId: "lula3", score: 7.5 }) === null, "nota fracionada recusada");
check(parseVote({ termId: "lula3", score: 11 }) === null, "nota acima de 10 recusada");
check(parseVote({ termId: "fhc", score: 5 }) === null, "mandato desconhecido recusado");
check(parseVote("lixo") === null, "corpo inválido recusado");

await castVote(query, { termId: "lula3", score: 8 }, "ana", "ip1");
await castVote(query, { termId: "lula3", score: 4 }, "bia", "ip2");
await castVote(query, { termId: "lula3", score: 6 }, "ana", "ip1"); // Ana muda o voto
let s = (await summarize(query)).find((x) => x.termId === "lula3")!;
check(s.count === 2, `troca de voto não duplica (count=${s.count})`);
check(s.average === 5, `média 5 (veio ${s.average})`);
check(s.histogram[6] === 1 && s.histogram[4] === 1 && s.histogram[8] === 0, "histograma");
check((await myVotes(query, "ana")).lula3 === 6, "voto da Ana lembrado");
check((await summarize(query)).find((x) => x.termId === "temer")!.average === null, "mandato sem voto tem média nula");

let blocked = false;
for (let i = 0; i < MAX_VOTES_PER_HOUR + 2; i++) {
  if (!(await castVote(query, { termId: "dilma1", score: 5 }, `bot${i}`, "ip-bot"))) blocked = true;
}
s = (await summarize(query)).find((x) => x.termId === "dilma1")!;
check(blocked && s.count === MAX_VOTES_PER_HOUR, `limite por IP (count=${s.count})`);

if (fail.length) {
  console.error("FALHOU:\n  " + fail.join("\n  "));
  process.exit(1);
}
console.log("OK: validação, troca de voto, médias, histograma e limite por IP.");
