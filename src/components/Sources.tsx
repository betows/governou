import type { Source } from "@/lib/types";

export function Sources({ sources }: { sources: Source[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {sources.map((s) => (
        <li key={s.url}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={s.title}
            className="inline-flex max-w-[18rem] items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-accent"
          >
            <span className="font-semibold text-ink">{s.outlet}</span>
            <span className="truncate">{s.title}</span>
            <span aria-hidden>↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
