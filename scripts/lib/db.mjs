/**
 * Ponte entre o conjunto de dados do app e o banco Neon (ver db/schema.sql).
 */

/** Literal SQL seguro para os tipos que usamos. */
export function lit(v) {
  if (v === null || v === undefined || v === "") return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (Array.isArray(v)) return v.length ? `ARRAY[${v.map(lit).join(", ")}]::text[]` : "'{}'::text[]";
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Separa um arquivo .sql simples (sem funções) em comandos, sem os comentários. */
export function splitSql(text) {
  return text
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

const isDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

/**
 * Gera os comandos de carga (upsert). Linhas marcadas como 'revisado' no banco
 * não são sobrescritas por pesquisa nova; só a API oficial sobrescreve números.
 */
export function seedStatements(dataset) {
  const out = [];

  for (const i of dataset.indicators) {
    out.push(
      `insert into indicator (id, name, unit, higher_is_better, official_source, source_url, notes) values (${[
        i.id, i.name, i.unit, i.higherIsBetter, i.officialSource, i.sourceUrl, i.notes,
      ].map(lit).join(", ")}) on conflict (id) do update set name = excluded.name, unit = excluded.unit, ` +
        `higher_is_better = excluded.higher_is_better, official_source = excluded.official_source, ` +
        `source_url = coalesce(excluded.source_url, indicator.source_url), notes = excluded.notes`,
    );
    const rows = Object.entries(i.values).map(
      ([y, v]) => `(${[i.id, Number(y), v, i.origins?.[y] ?? "pesquisa", i.yearSources?.[y] ?? i.sourceUrl].map(lit).join(", ")})`,
    );
    if (rows.length) {
      out.push(
        `insert into indicator_value (indicator_id, year, value, origin, source_url) values ${rows.join(", ")} ` +
          `on conflict (indicator_id, year) do update set value = excluded.value, origin = excluded.origin, ` +
          `source_url = excluded.source_url, updated_at = now() ` +
          `where indicator_value.status <> 'revisado' or excluded.origin = 'api'`,
      );
    }
  }

  const sources = new Map();
  for (const item of [...dataset.events, ...dataset.factchecks]) {
    for (const s of item.sources) if (!sources.has(s.url)) sources.set(s.url, s);
  }
  const srcRows = [...sources.values()].map(
    (s) => `(${[s.url, s.outlet, s.title, isDate(s.date) ? s.date : null, Boolean(s.approx)].map(lit).join(", ")})`,
  );
  for (let k = 0; k < srcRows.length; k += 100) {
    out.push(
      `insert into source (url, outlet, title, published, approx) values ${srcRows.slice(k, k + 100).join(", ")} ` +
        `on conflict (url) do update set outlet = excluded.outlet, title = excluded.title, published = excluded.published, approx = excluded.approx`,
    );
  }

  for (const e of dataset.events) {
    out.push(
      `insert into gov_event (id, term_id, date, title, summary, impact, area, weight, evidence) values (${[
        e.id, e.termId, e.date, e.title, e.summary, e.impact, e.area, e.weight, e.evidence,
      ].map(lit).join(", ")}) on conflict (id) do update set term_id = excluded.term_id, date = excluded.date, ` +
        `title = excluded.title, summary = excluded.summary, impact = excluded.impact, area = excluded.area, ` +
        `weight = excluded.weight, evidence = excluded.evidence where gov_event.status <> 'revisado'`,
    );
    out.push(
      `insert into gov_event_source (event_id, source_id) select ${lit(e.id)}, id from source where url in (${e.sources
        .map((s) => lit(s.url))
        .join(", ")}) on conflict do nothing`,
    );
  }

  for (const c of dataset.factchecks) {
    out.push(
      `insert into factcheck (id, claim, claimant, about, date, date_approx, verdict, explanation, topic) values (${[
        c.id, c.claim, c.claimant, c.about, c.date, Boolean(c.dateApprox), c.verdict, c.explanation, c.topic,
      ].map(lit).join(", ")}) on conflict (id) do update set claim = excluded.claim, claimant = excluded.claimant, ` +
        `about = excluded.about, date = excluded.date, date_approx = excluded.date_approx, verdict = excluded.verdict, ` +
        `explanation = excluded.explanation, topic = excluded.topic where factcheck.status <> 'revisado'`,
    );
    out.push(
      `insert into factcheck_source (factcheck_id, source_id) select ${lit(c.id)}, id from source where url in (${c.sources
        .map((s) => lit(s.url))
        .join(", ")}) on conflict do nothing`,
    );
  }
  return out;
}

const day = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d ? String(d).slice(0, 10) : undefined);

/** Lê o banco e devolve o conjunto de dados no formato de src/data/dataset.json. */
export async function pullDataset(query) {
  const [inds, vals, events, checks] = await Promise.all([
    query(`select * from indicator order by id`),
    query(`select indicator_id, year, value, origin, source_url, status from indicator_value order by year`),
    query(`select e.*, coalesce(json_agg(json_build_object('outlet', s.outlet, 'title', s.title, 'url', s.url,
             'date', s.published, 'approx', s.approx) order by s.published) filter (where s.id is not null), '[]') as sources
           from gov_event e left join gov_event_source es on es.event_id = e.id left join source s on s.id = es.source_id
           group by e.id order by e.date`),
    query(`select c.*, coalesce(json_agg(json_build_object('outlet', s.outlet, 'title', s.title, 'url', s.url,
             'date', s.published, 'approx', s.approx)) filter (where s.id is not null), '[]') as sources
           from factcheck c left join factcheck_source cs on cs.factcheck_id = c.id left join source s on s.id = cs.source_id
           group by c.id order by c.date desc`),
  ]);

  const indicators = inds.map((i) => {
    const mine = vals.filter((v) => v.indicator_id === i.id);
    return {
      id: i.id,
      name: i.name,
      unit: i.unit,
      higherIsBetter: i.higher_is_better,
      officialSource: i.official_source,
      sourceUrl: i.source_url ?? "",
      notes: i.notes ?? "",
      values: Object.fromEntries(mine.map((v) => [v.year, Number(v.value)])),
      origins: Object.fromEntries(mine.map((v) => [v.year, v.origin])),
      yearSources: Object.fromEntries(mine.filter((v) => v.source_url).map((v) => [v.year, v.source_url])),
      reviewed: Object.fromEntries(mine.map((v) => [v.year, v.status === "revisado"])),
    };
  });

  const src = (list) => list.map((s) => ({ ...s, date: day(s.date) ?? undefined }));
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    indicators,
    events: events.map((e) => ({
      id: e.id, termId: e.term_id, date: day(e.date), title: e.title, summary: e.summary, impact: e.impact,
      area: e.area, weight: e.weight, evidence: e.evidence ?? "", status: e.status, sources: src(e.sources),
    })),
    factchecks: checks.map((c) => ({
      id: c.id, claim: c.claim, claimant: c.claimant, about: c.about, date: day(c.date), dateApprox: c.date_approx,
      verdict: c.verdict, explanation: c.explanation, topic: c.topic, status: c.status, sources: src(c.sources),
    })),
  };
}
