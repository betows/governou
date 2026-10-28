import { formatScore, gradeLabel } from "@/lib/scoring";
import { toneVar } from "@/lib/ui";

export function GradeRing({
  score,
  size = 112,
  stroke = 9,
  showLabel = true,
  provisional = false,
}: {
  score: number | null;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
  provisional?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : score / 10;
  const color = provisional ? "var(--none)" : toneVar(score);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={provisional ? `${Math.max(1, stroke * 0.35)} ${stroke * 0.9}` : c}
          strokeDashoffset={provisional ? 0 : c * (1 - pct)}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1), stroke .3s" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={`tabular font-serif leading-none ${provisional ? "text-muted" : ""}`} style={{ fontSize: size * 0.36 }}>
            {formatScore(score)}
          </div>
          {showLabel && (
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
              {provisional ? "Prévia" : gradeLabel(score).label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
