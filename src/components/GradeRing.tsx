import { formatScore, gradeLabel } from "@/lib/scoring";
import { toneVar } from "@/lib/ui";

export function GradeRing({
  score,
  size = 112,
  stroke = 8,
  showLabel = true,
  provisional = false,
}: {
  score: number | null;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
  provisional?: boolean;
}) {
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : score / 10;
  const color = score === null ? "var(--muted)" : toneVar(score);
  const ticks = 40;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size, color }} title={provisional ? "Nota prévia: cobertura de dados abaixo de 60%" : undefined}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        {/* marcações de escala */}
        {Array.from({ length: ticks }, (_, i) => {
          const a = (i / ticks) * 2 * Math.PI;
          const r1 = size / 2 - 1;
          const r2 = size / 2 - 3.5;
          return (
            <line
              key={i}
              x1={size / 2 + r1 * Math.cos(a)}
              y1={size / 2 + r1 * Math.sin(a)}
              x2={size / 2 + r2 * Math.cos(a)}
              y2={size / 2 + r2 * Math.sin(a)}
              stroke={i / ticks < pct ? "currentColor" : "var(--line)"}
              strokeWidth={1}
              opacity={0.7}
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={provisional ? `${stroke * 0.6} ${stroke * 0.7}` : c}
          strokeDashoffset={provisional ? 0 : c * (1 - pct)}
          opacity={provisional ? 0.5 : 1}
          className={provisional ? "" : "glow"}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1), color .3s" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className={`tabular font-semibold leading-none ${provisional ? "text-muted" : "text-ink"}`}
            style={{ fontSize: size * 0.27, textShadow: provisional ? undefined : `0 0 ${size * 0.15}px ${color}` }}
          >
            {formatScore(score)}
          </div>
          {showLabel && (
            <div className="mt-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color }}>
              {provisional ? "◌ Prévia" : gradeLabel(score).label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
