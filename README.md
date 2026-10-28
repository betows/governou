# Raio-X do Planalto

Notas de 0 a 10 para cada governo brasileiro dos últimos 20 anos (Lula 2, Dilma 1 e 2, Temer, Bolsonaro, Lula 3),
calculadas por um **algoritmo público** a partir de **dados oficiais**, com os acertos, os erros e as checagens de
fake news, tudo com fonte.

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # site estático em out/ (pode ir para Vercel, Netlify, GitHub Pages…)
```

## Estrutura

| Caminho | O que é |
|---|---|
| `research/*.json` | Dados brutos levantados: indicadores, fatos por mandato e checagens. **Toda entrada tem URL de fonte.** |
| `scripts/fetch-official.mjs` | `npm run data:fetch`: baixa séries do Banco Central (API SGS) para `research/official-bcb.json`. |
| `scripts/build-data.mjs` | `npm run data:build`: valida tudo (fonte obrigatória, data dentro do mandato, enums) e gera `src/data/dataset.json`. Roda sozinho antes de `dev`/`build`. |
| `src/lib/scoring.ts` | O algoritmo de nota: faixas fixas por indicador, pilares e pesos. |
| `src/lib/terms.ts` | Mandatos e atribuição de anos. |
| `src/app/` | Páginas: início, `/governo/[id]`, `/monitor`, `/comparar`, `/checagem`, `/metodologia`. |

## Algoritmo (resumo)

1. Para cada indicador calcula-se o valor do mandato (média anual ou variação no mandato).
2. Interpolação linear numa faixa **fixa** de referência gera a nota 0–10.
3. Pilares: Economia 25%, Contas públicas 20%, Social 25%, Meio ambiente 10%, Segurança 10% e Fatos de governo 10%.
   O usuário pode mudar os pesos.
4. Opções: descontar o PIB mundial (FMI) e aplicar defasagem de 1 ano.
5. Salvaguardas: a nota aparece como **prévia** enquanto a cobertura de indicadores for menor que 60%, e o pilar
   "Fatos" só entra com ≥ 12 fatos documentados no mandato.

## Princípios de precisão

- Nenhum número é estimado ou preenchido "de memória": ano sem dado verificado fica vazio.
- Toda URL foi vista em resultado de busca ou baixada de API oficial; nada é montado à mão.
- Séries da API oficial (`official-*.json`) têm prioridade sobre valores levantados por busca.

## Pendências de dados (estado atual)

- Indicadores: PIB (2006–2025) completo; IPCA com 12 de 20 anos; demais séries pendentes.
  Com acesso de rede a `api.bcb.gov.br`, `npm run data:fetch` preenche Selic, IPCA, câmbio, dívida bruta,
  resultado primário e desemprego automaticamente.
- Fatos: Dilma 1 ainda sem levantamento; Temer com 7 fatos (desbalanceado, falta a parte negativa).
- Várias manchetes e datas de fontes foram reconstruídas a partir dos resultados de busca e precisam de conferência
  manual. As checagens com data estimada estão marcadas com `dateApprox`.
