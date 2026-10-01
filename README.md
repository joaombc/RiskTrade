# RiskTrade

Painel de análise técnica de mercado: busque um ativo (ações da B3 e dos EUA, ETFs, cripto), veja a cotação e o gráfico diário, marque padrões com ferramentas de desenho, acompanhe uma watchlist, dimensione a posição pelo risco e consulte um glossário com exemplos reais.

Os dados vêm do Yahoo Finance pela biblioteca [`yahoo-finance2`](https://github.com/gadicc/yahoo-finance2), que acessa uma API **não oficial**, sem garantia de disponibilidade.

## Funcionalidades

- **Busca de ativos**: autocomplete por ticker ou nome (`AAPL`, `PETR4.SA`, `BTC-USD`) e painel com preço, variação, range do dia, volume contra a média de 20 dias e status do mercado.
- **Gráfico diário**: candles, volume e OBV em painéis separados, com períodos de 3 meses a 5 anos.
- **Ferramentas de desenho**: linha de tendência, leque, suporte/resistência com inversão de papel, canal, Fibonacci, terços de Gann, linhas de velocidade, triângulos e OCO. Triângulos e OCO têm detecção de rompimento e projeção de alvo.
- **Divergência de volume**: alerta quando o preço faz novo topo ou fundo sem confirmação do OBV.
- **Watchlist**: favoritos com sparkline, ordenação e etiquetas de cenário.
- **Gestão de risco**: tamanho da posição pelo risco por operação, validação da relação recompensa/risco (mínimo 3:1) e saída em terços. Entrada, stop e alvo aparecem no gráfico.
- **Glossário** (`/glossario`): termos com diagrama, regra de validação e o botão "Ver no gráfico real", que abre um exemplo histórico no gráfico.

Desenhos, favoritos e preferências ficam no `localStorage` do navegador. Não há login nem banco de dados.

## Requisitos

- **Node.js 22 ou superior** (exigência do `yahoo-finance2`)
- npm
- Acesso à internet (para buscar os dados do Yahoo Finance)

Não é preciso configurar variáveis de ambiente nem chaves de API.

## Como rodar

```bash
git clone https://github.com/joaombc/RiskTrade.git
cd RiskTrade
npm install
npm run dev
```

Depois abra [http://localhost:3000](http://localhost:3000).

### Versão de produção

```bash
npm run build
npm start
```

### Testes e qualidade

```bash
npm test            # testes unitários (Vitest)
npx tsc --noEmit    # checagem de tipos
npm run lint        # ESLint
```

> O `tsc` usa tipos gerados pelo Next (`LayoutProps`). Se ele reclamar disso num clone novo, rode `npm run build` (ou `npm run dev`) uma vez antes.

## Estrutura

```
src/
├── app/
│   ├── page.tsx               # painel principal
│   ├── glossario/             # página do glossário
│   └── api/                   # rotas que consultam o Yahoo Finance no servidor
│       ├── search/            #   autocomplete de ativos
│       ├── quote/             #   resumo do ativo
│       ├── history/           #   candles diários
│       └── watchlist/         #   cotações em lote para os favoritos
├── components/
│   ├── chart/                 # gráfico, plugin de desenhos, painel de divergências
│   ├── watchlist/             # estrela, painel lateral, sparkline
│   ├── risk/                  # calculadora de risco
│   └── glossary/              # cards, diagramas SVG, busca
└── lib/                       # lógica pura e testada
    ├── drawings/              #   geometria dos desenhos, eixo de tempo, persistência
    ├── glossary/              #   termos, exemplos históricos, busca
    ├── indicators.ts          #   OBV e divergências
    ├── risk.ts                #   dimensionamento de posição
    ├── watchlist.ts           #   ordenação e etiquetas
    └── yahoo.ts               #   acesso ao Yahoo Finance (somente servidor)
```

As chamadas ao Yahoo passam pelas rotas em `src/app/api`, porque a API não pode ser acessada direto do navegador (CORS).

## Links diretos

O painel aceita parâmetros na URL, usados pelo glossário:

```
/?ativo=PETR4.SA&periodo=5y            # abre o ativo no período (3m, 6m, 1y, 2y, 5y)
/?ativo=AAPL&periodo=5y&exemplo=oco    # e aplica um exemplo do glossário
```

## Aviso

Este projeto é uma ferramenta de estudo de análise técnica. Nada aqui é recomendação de investimento.
