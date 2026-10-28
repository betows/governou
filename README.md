# Governou

Notas de 0 a 10 para cada governo brasileiro dos últimos 20 anos (Lula 2, Dilma 1 e 2, Temer, Bolsonaro, Lula 3),
calculadas por um **algoritmo público** a partir de **dados oficiais**, com os acertos, os erros e as checagens de
fake news, tudo com fonte.

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # site estático em out/ (pode ir para Vercel, Netlify, GitHub Pages…)
```

## Dados

```
research/*.json ──(npm run db:push)──▶ Neon (Postgres) ──(build)──▶ src/data/dataset.json ──▶ site estático
API do Banco Central ─(npm run data:fetch)─┘
```

- **Neon é a fonte oficial.** Esquema em `db/schema.sql`: indicadores com valor **e fonte por ano**, fatos, fontes e
  checagens. Tudo que vem de pesquisa nasce com `status = 'pendente'`; uma pessoa revisa e marca `'revisado'`, e daí em
  diante nenhuma carga automática sobrescreve aquela linha (só a API oficial sobrescreve números).
- `npm run db:push`: valida `research/` e faz upsert no banco (precisa de `DATABASE_URL`). Sempre grava `db/seed.sql`.
- `npm run build`: com `DATABASE_URL`, lê do banco; sem ela, usa `research/` direto (desenvolvimento local).
- `npm run db:test`: testa esquema, carga e leitura num Postgres em memória (PGlite), sem precisar do Neon.
- `npm run data:fetch`: baixa séries do Banco Central (API SGS) para `research/official-bcb.json`.

| Caminho | O que é |
|---|---|
| `research/*.json` | Levantamentos com fonte: `indicators*.json`, `events-<mandato>.json`, `factchecks.json`. |
| `scripts/lib/research.mjs` | Validação: fonte obrigatória, data dentro do mandato, vereditos e impactos válidos. |
| `scripts/lib/db.mjs` | Upsert para o banco e leitura de volta. |
| `src/lib/scoring.ts` | O algoritmo de nota. |
| `src/app/` | Páginas: boletim, `/governo/[id]`, `/monitor`, `/comparar`, `/checagem`, `/metodologia`. |

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
