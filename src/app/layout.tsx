import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ScoreProvider } from "@/components/ScoreProvider";
import { DATA } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Raio-X do Planalto — a nota de cada governo", template: "%s · Raio-X do Planalto" },
  description:
    "Notas para cada governo brasileiro dos últimos 20 anos, calculadas com dados oficiais (IBGE, Banco Central, INPE, IPEA), acertos e erros documentados e checagem de fake news — tudo com fontes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ScoreProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="mt-24 border-t border-line">
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-[2fr_1fr]">
              <p>
                Projeto apartidário. As notas saem de um algoritmo público aplicado a dados oficiais — não de opinião.
                Encontrou um erro? Toda informação tem fonte; abra a fonte, compare e nos avise.{" "}
                <Link href="/metodologia/" className="text-accent hover:underline">
                  Veja como a nota é calculada.
                </Link>
              </p>
              <p className="sm:text-right">
                Base de dados atualizada em <span className="tabular text-ink">{DATA.generatedAt}</span>
              </p>
            </div>
          </footer>
        </ScoreProvider>
      </body>
    </html>
  );
}
