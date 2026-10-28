import { bioOf, electionOf } from "@/lib/data";
import { formatPeriod } from "@/lib/terms";
import type { Term } from "@/lib/types";
import { fmtDate } from "@/lib/ui";
import { Portrait, PortraitCredit } from "./Portrait";
import { Sources } from "./Sources";

const pct = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/** Ficha do governante: foto 3x4 com clipe e campos datilografados. */
export function PersonFile({ term, number, aside }: { term: Term; number: number; aside?: React.ReactNode }) {
  const bio = bioOf(term.person);
  const election = electionOf(term.electionYear);
  const winnerShare = election?.national[election.winner];
  const runnerUp = election?.candidates.find((c) => c.id !== election.winner);

  return (
    <article className="sheet relative overflow-hidden p-5 sm:p-7">
      <header className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-2">
        <span className="label">Ficha do governante</span>
        <span className="tabular text-sm text-muted">
          nº {String(number).padStart(2, "0")}/06
        </span>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex justify-center sm:block">
          <Portrait person={term.person} width={148} />
        </div>

        <dl className="grid min-w-0 gap-x-6 sm:grid-cols-2">
          <Field label="Nome completo" wide value={bio?.fullName ?? term.president} />
          <Field label="Partido" value={term.party} />
          <Field label="Mandato" value={`${formatPeriod(term)}`} />
          <Field label="Nascimento" value={bio?.birthDate ? fmtDate(bio.birthDate) : undefined} />
          <Field label="Naturalidade" value={bio?.birthPlace} />
          <Field label="Profissão" value={bio?.profession} />
          <Field label="Vice" value={term.vice} />
          <Field label="Como chegou ao cargo" wide value={term.howTookOffice} />
          {winnerShare !== undefined && runnerUp && (
            <Field
              label={`Votação no 2º turno de ${election!.year}`}
              wide
              value={`${pct(winnerShare)} dos votos válidos, contra ${pct(election!.national[runnerUp.id])} de ${runnerUp.name} (${runnerUp.party})`}
            />
          )}
          {bio && bio.previousOffices.length > 0 && (
            <Field label="Cargos anteriores" wide value={bio.previousOffices.join("; ")} />
          )}
        </dl>
      </div>

      {aside && <div className="mt-6">{aside}</div>}

      <footer className="mt-6 space-y-2 border-t border-line pt-3 text-xs text-muted">
        {bio ? (
          <div className="flex flex-wrap items-center gap-2">
            <span>Fontes da ficha:</span>
            <Sources sources={bio.sources} />
          </div>
        ) : (
          <p>Dados biográficos ainda em verificação; os campos vazios aparecem como “—”.</p>
        )}
        <p>
          <PortraitCredit person={term.person} />
        </p>
      </footer>
    </article>
  );
}

function Field({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={`field ${wide ? "sm:col-span-2" : ""}`}>
      <dt>{label}</dt>
      <dd className={value ? "" : "text-muted"}>{value || "—"}</dd>
    </div>
  );
}
