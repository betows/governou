#!/usr/bin/env node
/**
 * Baixa o retrato de cada presidente do Wikimedia Commons, com autor e licença,
 * recorta no formato 3x4 com foco no rosto e grava em public/retratos/ + src/data/portraits.json.
 *
 * Escolha da imagem: junta candidatas (imagem da página na Wikipédia em português e
 * em inglês, imagem do Wikidata e arquivos oficiais conhecidos), descarta as de licença
 * não livre e as versões "denoise", e fica com a de maior resolução.
 *
 * Só aceita licenças livres (CC BY, CC BY-SA, CC0, "Attribution" ou domínio público).
 * Se algo falhar, mantém o retrato anterior e o site usa o monograma.
 * Roda no build da Vercel; localmente use npm run data:portraits (precisa de acesso à Wikipédia).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const PEOPLE = {
  // upper: fração superior da foto mantida antes do recorte 3x4 (foto de meio corpo → foca o rosto)
  lula: {
    pages: ["pt:Luiz_Inácio_Lula_da_Silva", "en:Luiz_Inácio_Lula_da_Silva"],
    files: ["Foto oficial de Luiz Inácio Lula da Silva (ombros).jpg", "Foto oficial de Luiz Inácio Lula da Silva.jpg"],
    upper: 0.6,
  },
  dilma: {
    pages: ["pt:Dilma_Rousseff", "en:Dilma_Rousseff"],
    files: ["Dilma Rousseff - foto oficial 2011-01-09.jpg"],
    upper: 0.5,
  },
  temer: { pages: ["pt:Michel_Temer", "en:Michel_Temer"], files: [], upper: 0.85 },
  bolsonaro: { pages: ["pt:Jair_Bolsonaro", "en:Jair_Bolsonaro"], files: [], upper: 0.85 },
};
const UA = { "user-agent": "Governou/1.0 (https://github.com/betows/governou)" };
// Licenças livres aceitas. "Attribution" é a licença do Commons que só exige crédito.
const FREE = /^(cc[- ]by|cc0|public domain|domínio público|pd|attribution$)/i;
const OUT_W = 600;
const OUT_H = 800;

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

/** Nome do arquivo a partir da URL de upload (ignora ?utm_source=... e o prefixo de miniatura). */
function fileFromUrl(url) {
  const parts = new URL(url).pathname.split("/");
  const thumb = parts.indexOf("thumb");
  return decodeURIComponent(thumb >= 0 ? parts[thumb + 3] : parts.pop());
}

async function candidatesFor(cfg) {
  const names = new Set(cfg.files);
  for (const p of cfg.pages) {
    const [lang, title] = p.split(":");
    try {
      const s = await json(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      const src = s.originalimage?.source ?? s.thumbnail?.source;
      if (src) names.add(fileFromUrl(src));
      if (s.wikibase_item) {
        const claims = await json(
          `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P18&entity=${s.wikibase_item}`,
        );
        for (const c of claims.claims?.P18 ?? []) if (c.mainsnak?.datavalue?.value) names.add(c.mainsnak.datavalue.value);
      }
    } catch (err) {
      console.warn(`  (aviso) ${p}: ${err.message}`);
    }
  }
  return [...names];
}

/** Metadados no Commons; thumburl já vem limitada a 1600 px de largura. */
async function infoFor(files) {
  const titles = files.map((f) => `File:${f}`).join("|");
  const q = await json(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600&titles=${encodeURIComponent(titles)}`,
  );
  return Object.values(q.query?.pages ?? {})
    .filter((p) => p.imageinfo?.[0])
    .map((p) => {
      const i = p.imageinfo[0];
      return {
        file: p.title.replace(/^File:/, ""),
        url: i.thumburl ?? i.url,
        width: i.width,
        height: i.height,
        page: i.descriptionurl,
        license: strip(i.extmetadata?.LicenseShortName?.value),
        author: strip(i.extmetadata?.Artist?.value),
      };
    });
}

// Só roda na Vercel ou quando pedido explicitamente (npm run data:portraits).
if (!process.env.VERCEL && process.env.npm_lifecycle_event !== "data:portraits") {
  console.log("Retratos: pulado fora da Vercel (use npm run data:portraits).");
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

for (const [id, cfg] of Object.entries(PEOPLE)) {
  try {
    const files = await candidatesFor(cfg);
    const all = await infoFor(files);
    const usable = all
      .filter((c) => FREE.test(c.license) && !/denoise/i.test(c.file) && /\.(jpe?g|png)$/i.test(c.file))
      .sort((a, b) => b.width - a.width);
    if (usable.length === 0) {
      throw new Error(`nenhuma candidata livre entre: ${all.map((c) => `${c.file} [${c.license}]`).join("; ") || files.join("; ")}`);
    }
    const pick = usable[0];

    const res = await fetch(pick.url, { headers: UA, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar ${pick.url}`);
    const input = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(input).metadata();

    // Mantém a parte de cima (onde fica o rosto) e recorta 3x4 a partir do topo.
    const keepH = Math.round(meta.height * cfg.upper);
    await sharp(input)
      .extract({ left: 0, top: 0, width: meta.width, height: keepH })
      .resize(OUT_W, OUT_H, { fit: "cover", position: "top" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toFile(new URL(`${id}.jpg`, outDir).pathname);

    result[id] = { src: `/retratos/${id}.jpg`, author: pick.author || "Autor não informado", license: pick.license, sourceUrl: pick.page };
    console.log(
      `✔ retrato de ${id}: ${pick.file} (${pick.width}×${pick.height}, baixado ${meta.width}×${meta.height}, ${pick.license}); ` +
        `candidatas: ${all.map((c) => c.file).join(" | ")}`,
    );
  } catch (err) {
    console.warn(`✘ retrato de ${id}: ${err.message}${previous[id] ? " (mantido o anterior)" : ""}`);
  }
}

writeFileSync(outJson, JSON.stringify(result, null, 2) + "\n");
