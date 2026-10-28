import raw from "@/data/dataset.json";
import type { Dataset, TermId } from "./types";

export const DATA = raw as unknown as Dataset;

export const eventsFor = (id: TermId) => DATA.events.filter((e) => e.termId === id);
export const factchecksFor = (id: TermId) => DATA.factchecks.filter((c) => c.about.includes(id));
export const series = (id: string) => DATA.indicators.find((i) => i.id === id);
