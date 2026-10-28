import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TermDetail } from "@/components/TermDetail";
import { TERM_BY_ID, TERMS } from "@/lib/terms";
import type { TermId } from "@/lib/types";

export function generateStaticParams() {
  return TERMS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/governo/[id]">): Promise<Metadata> {
  const { id } = await params;
  const t = TERM_BY_ID[id as TermId];
  return t ? { title: `${t.label} — nota e demonstrativo`, description: `Nota, indicadores oficiais, acertos e erros do governo ${t.label}, com fontes.` } : {};
}

export default async function Page({ params }: PageProps<"/governo/[id]">) {
  const { id } = await params;
  if (!TERM_BY_ID[id as TermId]) notFound();
  return <TermDetail id={id as TermId} />;
}
