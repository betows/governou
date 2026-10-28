import { portraitOf } from "@/lib/data";
import type { PersonId } from "@/lib/types";

const NAMES: Record<PersonId, string> = { lula: "Lula", dilma: "Dilma Rousseff", temer: "Michel Temer", bolsonaro: "Jair Bolsonaro" };
const INITIALS: Record<PersonId, string> = { lula: "LL", dilma: "DR", temer: "MT", bolsonaro: "JB" };

/** Foto 3x4 com clipe. Sem retrato baixado, mostra as iniciais no lugar da foto. */
export function Portrait({ person, width = 132, clip = true }: { person: PersonId; width?: number; clip?: boolean }) {
  const p = portraitOf(person);
  return (
    <figure className="photo-3x4 shrink-0" style={{ width }}>
      {clip && <PaperClip />}
      {p ? (
        // eslint-disable-next-line @next/next/no-img-element -- export estático, imagem já redimensionada no build
        <img src={p.src} alt={`Retrato de ${NAMES[person]}`} width={width} height={Math.round((width * 4) / 3)} loading="lazy" decoding="async" />
      ) : (
        <div className="mono grid place-items-center bg-surface-2 font-display text-4xl text-muted" aria-label={`Sem retrato de ${NAMES[person]}`}>
          {INITIALS[person]}
        </div>
      )}
    </figure>
  );
}

export function PortraitCredit({ person }: { person: PersonId }) {
  const p = portraitOf(person);
  if (!p) return null;
  return (
    <span>
      Foto: {p.author} ·{" "}
      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pen">
        {p.license}, Wikimedia Commons
      </a>
    </span>
  );
}

function PaperClip() {
  return (
    <svg className="absolute -top-4 left-5 z-10 h-12 w-5" viewBox="0 0 20 48" aria-hidden fill="none">
      <path
        d="M6 30V8a4 4 0 0 1 8 0v26a6 6 0 0 1-12 0V12"
        stroke="var(--muted)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
