import { useId } from "react";

export function Sparkline({
  values,
  highlight,
  height = 44,
}: {
  values: Record<string, number>;
  highlight?: number[];
  height?: number;
}) {
  const gid = useId();
  const years = Object.keys(values).map(Number).sort((a, b) => a - b);
  if (years.length < 2) return null;
  const vs = years.map((y) => values[y]);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const w = 240;
  const x = (y: number) => ((y - years[0]) / (years[years.length - 1] - years[0])) * w;
  const yv = (v: number) => (max === min ? height / 2 : height - 4 - ((v - min) / (max - min)) * (height - 8));
  const d = years.map((y, i) => `${i ? "L" : "M"}${x(y).toFixed(1)},${yv(values[y]).toFixed(1)}`).join("");
  const area = `${d}L${w},${height}L0,${height}Z`;
  const hl = highlight?.filter((y) => values[y] !== undefined) ?? [];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img" aria-label="Série histórica">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {hl.length > 0 && (
        <rect x={x(Math.min(...hl)) - 3} width={x(Math.max(...hl)) - x(Math.min(...hl)) + 6} y={0} height={height} fill="var(--accent-soft)" rx={3} />
      )}
      {min < 0 && max > 0 && <line x1={0} x2={w} y1={yv(0)} y2={yv(0)} stroke="var(--line)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke="var(--accent)" strokeOpacity={0.85} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      {hl.map((y) => (
        <circle key={y} cx={x(y)} cy={yv(values[y])} r={2.6} fill="var(--great)" />
      ))}
    </svg>
  );
}
