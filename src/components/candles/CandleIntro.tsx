/** Introdução da página: anatomia da vela e as regras de uso dos padrões (Murphy, cap. 12). */
function Anatomy() {
  // Vela de alta à esquerda e de baixa à direita, com os rótulos dos preços.
  return (
    <svg role="img" aria-label="Anatomia de uma vela de alta e de uma vela de baixa" viewBox="0 0 260 150" className="h-auto w-full max-w-md">
      <g className="text-positive">
        <line x1={60} x2={60} y1={15} y2={135} stroke="currentColor" strokeWidth={2} />
        <rect x={45} y={40} width={30} height={65} fill="currentColor" rx={2} />
      </g>
      <g className="text-negative">
        <line x1={190} x2={190} y1={15} y2={135} stroke="currentColor" strokeWidth={2} />
        <rect x={175} y={40} width={30} height={65} fill="currentColor" rx={2} />
      </g>
      <g className="fill-foreground text-[8px]">
        <text x={80} y={18}>máxima</text>
        <text x={80} y={43}>fechamento</text>
        <text x={80} y={108}>abertura</text>
        <text x={80} y={138}>mínima</text>
        <text x={6} y={28} className="fill-muted">sombra</text>
        <text x={6} y={75} className="fill-muted">corpo</text>
        <text x={6} y={124} className="fill-muted">sombra</text>
        <text x={210} y={43}>abertura</text>
        <text x={210} y={108}>fechamento</text>
      </g>
      <g className="fill-muted text-[8px]">
        <text x={60} y={149} textAnchor="middle">
          de alta (branca)
        </text>
        <text x={190} y={149} textAnchor="middle">
          de baixa (preta)
        </text>
      </g>
    </svg>
  );
}

const RULES = [
  {
    title: "O contexto é obrigatório",
    text: "Um padrão de reversão de alta só existe depois de uma queda, e um de baixa só depois de uma alta. A mesma figura numa alta não é um padrão de alta. Antes de procurar padrões, defina a tendência de curto prazo; uma média móvel de cerca de 10 períodos resolve.",
  },
  {
    title: "Confirme antes de agir",
    text: "A maioria dos padrões de reversão pede confirmação no pregão seguinte: uma vela no sentido da reversão, ou o fechamento além do padrão. Os padrões mostram a psicologia do momento, não garantem o próximo movimento.",
  },
  {
    title: "Filtre com um oscilador",
    text: "Greg Morris propõe considerar só os padrões de reversão que aparecem quando um oscilador (como o estocástico %D) está em sobrecompra, acima de 80, ou em sobrevenda, abaixo de 20. Isso elimina muitos sinais prematuros.",
  },
];

export function CandleIntro() {
  return (
    <section aria-labelledby="como-ler" className="grid gap-6 rounded-2xl border border-border bg-surface p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:p-6">
      <div className="flex flex-col gap-3">
        <h2 id="como-ler" className="text-xl font-semibold">
          Como ler uma vela
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">
          A vela usa os mesmos dados da barra: abertura, máxima, mínima e fechamento. O corpo vai da abertura ao fechamento; as sombras
          (ou pavios) mostram a máxima e a mínima. No livro, a vela de alta é branca (vazada) e a de baixa, preta; aqui elas aparecem em
          verde e vermelho, como no gráfico do RiskTrade. Os japoneses dão grande peso à abertura e ao fechamento.
        </p>
        <Anatomy />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed text-foreground/90">
          Um padrão de velas tem de uma a cinco velas e retrata a psicologia dos participantes naquele momento. A maioria indica reversão,
          mas há padrões de continuação. Quase sempre existe um par: para cada padrão de alta há um de baixa, em geral com o mesmo nome.
        </p>
        {RULES.map((r) => (
          <div key={r.title} className="rounded-xl bg-accent/10 p-3">
            <h3 className="text-sm font-semibold text-accent">{r.title}</h3>
            <p className="mt-1 text-sm leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
