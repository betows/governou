import { formatScore, situation } from "@/lib/scoring";
import { toneVar } from "@/lib/ui";

/** Nota escrita no boletim: azul a partir de 7, vermelha abaixo de 5. */
export function Grade({ score, provisional = false, size = "md" }: { score: number | null; provisional?: boolean; size?: "sm" | "md" | "lg" | "xl" }) {
  const cls = {
    sm: "tabular font-bold text-base",
    md: "tabular font-bold text-2xl",
    lg: "font-display text-6xl tabular-nums",
    xl: "font-display text-8xl tabular-nums sm:text-9xl",
  }[size];
  return (
    <span
      className={`leading-none ${cls}`}
      style={{ color: score === null ? "var(--muted)" : toneVar(score), opacity: provisional ? 0.55 : 1 }}
      title={provisional ? "Nota prévia: menos de 60% dos indicadores verificados" : undefined}
    >
      {formatScore(score)}
    </span>
  );
}

export function Stamp({ score, provisional, size = "md", animate = false }: { score: number | null; provisional: boolean; size?: "sm" | "md" | "lg"; animate?: boolean }) {
  const s = situation(score, provisional);
  const fs = { sm: "0.66rem", md: "0.82rem", lg: "1.15rem" }[size];
  return (
    <span
      className={`stamp ${s.tone === "none" ? "pending" : ""} ${animate ? "animate" : ""}`}
      style={{ color: `var(--${s.tone})`, fontSize: fs }}
    >
      {s.label}
    </span>
  );
}
