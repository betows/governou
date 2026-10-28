import { TERMS } from "./terms";
import type { TermId } from "./types";

/** Executa SQL parametrizado e devolve as linhas (neon no servidor, PGlite nos testes). */
export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export interface VoteSummary {
  termId: TermId;
  count: number;
  average: number | null;
  /** Quantos votos em cada nota, de 0 a 10. */
  histogram: number[];
}

/** Máximo de votos (novos ou alterados) por IP numa hora. */
export const MAX_VOTES_PER_HOUR = 30;

const TERM_IDS = new Set<string>(TERMS.map((t) => t.id));

export function parseVote(body: unknown): { termId: TermId; score: number } | null {
  if (!body || typeof body !== "object") return null;
  const { termId, score } = body as Record<string, unknown>;
  if (typeof termId !== "string" || !TERM_IDS.has(termId)) return null;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 10) return null;
  return { termId: termId as TermId, score };
}

export async function summarize(query: Query): Promise<VoteSummary[]> {
  const rows = await query(
    `select term_id, score, count(*)::int as n from public_vote group by term_id, score`,
  );
  return TERMS.map((t) => {
    const histogram = Array.from({ length: 11 }, () => 0);
    for (const r of rows) if (r.term_id === t.id) histogram[Number(r.score)] = Number(r.n);
    const count = histogram.reduce((a, b) => a + b, 0);
    const average = count ? histogram.reduce((a, n, score) => a + n * score, 0) / count : null;
    return { termId: t.id, count, average, histogram };
  });
}

export async function myVotes(query: Query, voter: string): Promise<Partial<Record<TermId, number>>> {
  const rows = await query(`select term_id, score from public_vote where voter = $1`, [voter]);
  return Object.fromEntries(rows.map((r) => [r.term_id, Number(r.score)]));
}

/** Grava ou altera o voto. Devolve false se o IP passou do limite por hora. */
export async function castVote(query: Query, vote: { termId: TermId; score: number }, voter: string, ipHash: string) {
  const [{ n }] = await query(
    `select count(*)::int as n from public_vote where ip_hash = $1 and updated_at > now() - interval '1 hour'`,
    [ipHash],
  );
  if (Number(n) >= MAX_VOTES_PER_HOUR) return false;
  await query(
    `insert into public_vote (term_id, voter, ip_hash, score) values ($1, $2, $3, $4)
     on conflict (term_id, voter) do update set score = excluded.score, ip_hash = excluded.ip_hash, updated_at = now()`,
    [vote.termId, voter, ipHash, vote.score],
  );
  return true;
}
