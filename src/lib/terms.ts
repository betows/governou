import type { Term, TermId } from "./types";

export const TERMS: Term[] = [
  {
    id: "lula2",
    president: "Luiz Inácio Lula da Silva",
    shortName: "Lula",
    label: "Lula · 2º mandato",
    party: "PT",
    vice: "José Alencar",
    start: "2007-01-01",
    end: "2010-12-31",
    years: [2007, 2008, 2009, 2010],
  },
  {
    id: "dilma1",
    president: "Dilma Rousseff",
    shortName: "Dilma",
    label: "Dilma · 1º mandato",
    party: "PT",
    vice: "Michel Temer",
    start: "2011-01-01",
    end: "2014-12-31",
    years: [2011, 2012, 2013, 2014],
  },
  {
    id: "dilma2",
    president: "Dilma Rousseff",
    shortName: "Dilma",
    label: "Dilma · 2º mandato",
    party: "PT",
    vice: "Michel Temer",
    start: "2015-01-01",
    end: "2016-05-12",
    years: [2015],
    note: "Mandato interrompido pelo impeachment (afastamento em 12/05/2016, cassação em 31/08/2016). O ano de 2016 é atribuído a Temer, que governou a maior parte dele.",
  },
  {
    id: "temer",
    president: "Michel Temer",
    shortName: "Temer",
    label: "Temer",
    party: "MDB",
    vice: "—",
    start: "2016-05-12",
    end: "2018-12-31",
    years: [2016, 2017, 2018],
    note: "Interino a partir de 12/05/2016 e efetivado em 31/08/2016.",
  },
  {
    id: "bolsonaro",
    president: "Jair Messias Bolsonaro",
    shortName: "Bolsonaro",
    label: "Bolsonaro",
    party: "PSL / PL",
    vice: "Hamilton Mourão",
    start: "2019-01-01",
    end: "2022-12-31",
    years: [2019, 2020, 2021, 2022],
  },
  {
    id: "lula3",
    president: "Luiz Inácio Lula da Silva",
    shortName: "Lula",
    label: "Lula · 3º mandato",
    party: "PT",
    vice: "Geraldo Alckmin",
    start: "2023-01-01",
    end: "2026-12-31",
    years: [2023, 2024, 2025, 2026],
    current: true,
    note: "Mandato em curso. Lula foi reeleito em 25/10/2026 para um 4º mandato (2027–2030). Anos sem dado oficial fechado ficam de fora do cálculo.",
  },
];

export const TERM_BY_ID = Object.fromEntries(TERMS.map((t) => [t.id, t])) as Record<TermId, Term>;
export const CURRENT_TERM = TERMS.find((t) => t.current)!;

export function formatPeriod(t: Term) {
  const fmt = (d: string) => d.slice(0, 4);
  return t.current ? `${fmt(t.start)}–hoje` : `${fmt(t.start)}–${fmt(t.end)}`;
}
