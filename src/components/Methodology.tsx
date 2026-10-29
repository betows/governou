import { DATA } from "@/lib/data";
import { MIN_EVENTS, PILLARS, RULES } from "@/lib/scoring";
import { TERMS } from "@/lib/terms";

const AGG = { media: "Média anual", variacao: "Variação no mandato", variacao_pct: "Variação % no mandato" } as const;

export function Methodology() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Transparência total</p>
      <h1 className="mt-3 font-display text-5xl font-bold">Como a nota é calculada</h1>
      <p className="mt-4 text-lg text-muted">
        A nota não é opinião: é o resultado de um algoritmo público aplicado a séries oficiais. Qualquer pessoa pode refazer
        a conta — o código está no repositório (<code className="text-sm">src/lib/scoring.ts</code>).
      </p>

      <H2>1. Os mandatos</H2>
      <p>
        Analisamos os últimos 20 anos, mandato a mandato. Cada ano civil é atribuído a quem governou a maior parte dele:
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {TERMS.map((t) => (
          <li key={t.id} className="flex justify-between border-b border-line py-1.5">
            <span>{t.label}</span>
            <span className="tabular text-muted">{t.years.join(", ")}</span>
          </li>
        ))}
      </ul>

      <H2>2. Do dado à nota</H2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Para cada indicador calcula-se o valor do mandato: média anual, ou variação entre o ano anterior à posse e o último ano com dado.</li>
        <li>
          O valor vira nota de 0 a 10 por interpolação linear numa <strong>faixa fixa de referência</strong> (ex.: PIB médio de −2% = 0;
          5% = 10). Faixas fixas impedem que a nota de um governo mude só porque outro entrou na comparação.
        </li>
        <li>
          <strong>Janela completa:</strong> uma média só é calculada com pelo menos 75% dos anos do mandato; uma variação só
          vale se começar no ano anterior à posse (ou no primeiro ano) e terminar no último ano do mandato. No
          mandato em curso aceita-se o último dado publicado, com até 2 anos de defasagem. Séries publicadas a cada dois anos, como o IDEB, usam a edição mais próxima antes da posse e a última edição do mandato. Séries diferentes (ex.: PME e
          PNAD Contínua) nunca são misturadas dentro de um mesmo cálculo.
        </li>
        <li>A nota de cada pilar é a média ponderada dos seus indicadores com dado.</li>
        <li>A nota final é a média ponderada dos pilares. Pilares sem dados saem do cálculo e os pesos são redistribuídos.</li>
      </ol>

      <H2>3. Pilares e pesos padrão</H2>
      <ul className="space-y-2">
        {PILLARS.map((p) => (
          <li key={p.id} className="flex justify-between gap-4 border-b border-line py-2">
            <span>
              <strong>{p.name}</strong> <span className="text-muted">— {p.description}</span>
            </span>
            <span className="tabular shrink-0">{p.defaultWeight}%</span>
          </li>
        ))}
      </ul>

      <H2>4. Indicadores e faixas</H2>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2">Indicador</th>
              <th>Cálculo</th>
              <th className="text-right">Nota 0</th>
              <th className="text-right">Nota 10</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {RULES.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="py-2 pr-3">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-xs text-muted">{r.why}</div>
                </td>
                <td className="py-2 pr-3 text-muted">{AGG[r.aggregation]}</td>
                <td className="py-2 text-right">{r.worst.toLocaleString("pt-BR")}</td>
                <td className="py-2 text-right">
                  {r.best.toLocaleString("pt-BR")} <span className="text-xs text-muted">{r.unit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>5. Fatos de governo (acertos e erros)</H2>
      <p>
        Cada fato tem data, área, peso (1 a 3) e pelo menos uma fonte jornalística ou oficial. A classificação segue resultado
        mensurável e consenso técnico; quando a evidência é disputada, o fato é marcado como <em>controverso</em> e não puxa a
        nota para nenhum lado. Nota do pilar = 5 + 5 × (acertos − erros) ÷ total ponderado. Para evitar distorção por
        levantamento incompleto, o pilar só entra na nota quando o mandato tem pelo menos {MIN_EVENTS} fatos documentados.
      </p>

      <H2>6. Ajustes opcionais</H2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Cenário mundial:</strong> usa o PIB do Brasil menos o PIB mundial (FMI), com faixa −4 p.p. = 0 e +2 p.p. = 10.
        </li>
        <li>
          <strong>Defasagem de 1 ano:</strong> atribui a cada governo os indicadores do ano seguinte.
        </li>
      </ul>

      <H2>7. Fontes de dados</H2>
      <ul className="space-y-2 text-sm">
        {DATA.indicators.map((i) => (
          <li key={i.id} className="border-b border-line py-2">
            <div className="flex justify-between gap-3">
              <span className="font-medium">{i.name}</span>
              <span className="tabular shrink-0 text-muted">{Object.keys(i.values).length} anos verificados</span>
            </div>
            <div className="text-xs text-muted">
              {i.sourceUrl ? (
                <a href={i.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {i.officialSource} ↗
                </a>
              ) : (
                i.officialSource
              )}
            </div>
          </li>
        ))}
      </ul>

      <H2>8. Limitações — leia antes de compartilhar</H2>
      <ul className="list-disc space-y-2 pl-5 text-muted">
        <li>Indicadores medem resultados, não intenções. Parte dos resultados depende de Congresso, STF, estados, Banco Central e do cenário externo.</li>
        <li>Mandatos curtos (Dilma 2, Temer) têm menos anos de dado e, portanto, notas mais sensíveis.</li>
        <li>Séries oficiais são revisadas. Usamos a revisão mais recente disponível e registramos quebras de metodologia.</li>
        <li>O mandato atual está em curso: anos sem dado oficial fechado ficam de fora.</li>
        <li>Nenhum valor é preenchido por estimativa: ano sem dado verificado aparece como ausente.</li>
      </ul>
    </article>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-12 font-display text-3xl font-bold">{children}</h2>;
}
