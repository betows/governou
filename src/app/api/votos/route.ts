import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { NextRequest } from "next/server";
import { castVote, myVotes, parseVote, summarize, type Query } from "@/lib/votes";

const COOKIE = "gv_voter";

function db(): Query | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const sql = neon(url);
  return (text, params) => sql.query(text, params ?? []) as Promise<Record<string, unknown>[]>;
}

/**
 * Hash do IP com sal secreto: permite limitar abuso sem guardar o IP.
 * O sal é VOTE_SALT, ou, na falta dela, a própria DATABASE_URL (também secreta).
 */
function ipHash(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const salt = process.env.VOTE_SALT ?? process.env.DATABASE_URL ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

const unavailable = () => Response.json({ error: "Votação indisponível no momento." }, { status: 503 });

export async function GET(req: NextRequest) {
  const query = db();
  if (!query) return unavailable();
  const voter = req.cookies.get(COOKIE)?.value;
  const [summary, mine] = await Promise.all([summarize(query), voter ? myVotes(query, voter) : Promise.resolve({})]);
  return Response.json({ summary, mine }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const query = db();
  if (!query) return unavailable();
  const vote = parseVote(await req.json().catch(() => null));
  if (!vote) return Response.json({ error: "Voto inválido: escolha uma nota inteira de 0 a 10." }, { status: 400 });

  const voter = req.cookies.get(COOKIE)?.value ?? randomUUID();
  const ok = await castVote(query, vote, voter, ipHash(req));
  if (!ok) return Response.json({ error: "Muitos votos deste endereço na última hora. Tente mais tarde." }, { status: 429 });

  const res = Response.json({ ok: true, summary: await summarize(query), mine: await myVotes(query, voter) });
  res.headers.append(
    "set-cookie",
    `${COOKIE}=${voter}; Path=/; Max-Age=${60 * 60 * 24 * 365}; HttpOnly; Secure; SameSite=Lax`,
  );
  return res;
}
