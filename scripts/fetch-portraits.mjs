#!/usr/bin/env node
/**
 * Baixa o retrato de cada presidente da Wikipédia / Wikimedia Commons, junto com
 * autor e licença, e grava em public/retratos/ + src/data/portraits.json.
 *
 * Só aceita imagens com licença livre (CC BY, CC BY-SA, CC0 ou domínio público).
 * Se a rede falhar, mantém o portraits.json existente e o site usa o monograma.
 * Roda no build da Vercel; localmente depende de acesso a wikipedia.org.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PEOPLE = {
  lula: "Luiz_Inácio_Lula_da_Silva",
  dilma: "Dilma_Rousseff",
  temer: "Michel_Temer",
  bolsonaro: "Jair_Bolsonaro",
};
const UA = { "user-agent": "Governou/1.0 (https://github.com/betows/governou)" };
const FREE = /^(cc[- ]by|cc0|public domain|domínio público|pd)/i;

const outJson = new URL("../src/data/portraits.json", import.meta.url);
const outDir = new URL("../public/retratos/", import.meta.url);
const previous = existsSync(outJson) ? JSON.parse(readFileSync(outJson, "utf8")) : {};
const result = { ...previous };
const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function json(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

// Só roda na Vercel ou quando pedido explicitamente (npm run data:portraits).
const explicit = process.argv[1]?.endsWith("fetch-portraits.mjs") && process.env.npm_lifecycle_event === "data:portraits";
if (!process.env.VERCEL && !explicit) {
  console.log("Retratos: pulado fora da Vercel (use npm run data:portraits).");
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

for (const [id, page] of Object.entries(PEOPLE)) {
  try {
    const summary = await json(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`);
    const original = summary.originalimage?.source ?? summary.thumbnail?.source;
    if (!original) throw new Error("página sem imagem");
    // A URL pode trazer parâmetros (?utm_source=...): o nome do arquivo é o último trecho do caminho.
    const file = decodeURIComponent(new URL(original).pathname.split("/").pop());

    const q = await json(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480&titles=${encodeURIComponent(`File:${file}`)}`,
    );
    const info = Object.values(q.query?.pages ?? {})[0]?.imageinfo?.[0];
    if (!info) throw new Error(`sem metadados para ${file}`);
    const license = strip(info.extmetadata?.LicenseShortName?.value);
    if (!FREE.test(license)) throw new Error(`licença não livre (${license || "desconhecida"})`);

    const img = await fetch(info.thumburl ?? info.url, { headers: UA, signal: AbortSignal.timeout(20000) });
    if (!img.ok) throw new Error(`HTTP ${img.status} ao baixar a imagem`);
    writeFileSync(new URL(`${id}.jpg`, outDir), Buffer.from(await img.arrayBuffer()));

    result[id] = {
      src: `/retratos/${id}.jpg`,
      author: strip(info.extmetadata?.Artist?.value) || "Autor não informado",
      license,
      sourceUrl: info.descriptionurl,
    };
    console.log(`✔ retrato de ${id}: ${license}`);
  } catch (err) {
    console.warn(`✘ retrato de ${id}: ${err.message}${previous[id] ? " (mantido o anterior)" : ""}`);
  }
}

writeFileSync(outJson, JSON.stringify(result, null, 2) + "\n");
