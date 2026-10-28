import portraitsRaw from "@/data/portraits.json";
import raw from "@/data/dataset.json";
import type { Dataset, PersonId, Portrait, TermId } from "./types";

export const DATA = raw as unknown as Dataset;
const PORTRAITS = portraitsRaw as Partial<Record<PersonId, Portrait>>;

export const eventsFor = (id: TermId) => DATA.events.filter((e) => e.termId === id);
export const factchecksFor = (id: TermId) => DATA.factchecks.filter((c) => c.about.includes(id));
export const series = (id: string) => DATA.indicators.find((i) => i.id === id);
export const portraitOf = (id: PersonId) => PORTRAITS[id];
export const bioOf = (id: PersonId) => DATA.bios?.find((b) => b.id === id);
export const electionOf = (year: number | null) => (year ? DATA.elections?.find((e) => e.year === year) : undefined);
