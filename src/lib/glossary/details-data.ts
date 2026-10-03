import type { TermDetails } from "./types";

/**
 * Conteúdo do card ampliado de cada termo. Texto autoral, com base em John J. Murphy,
 * "Technical Analysis of the Financial Markets" (NYIF, 1999). Os capítulos citados são os
 * dessa edição.
 */
const MURPHY = "Murphy, Technical Analysis of the Financial Markets";
const CH4 = `${MURPHY}, cap. 4 (Conceitos básicos de tendência)`;
const CH5 = `${MURPHY}, cap. 5 (Padrões de reversão)`;
const CH6 = `${MURPHY}, cap. 6 (Padrões de continuação)`;
const CH7 = `${MURPHY}, cap. 7 (Volume e contratos em aberto)`;

export const DETAILS: Record<string, TermDetails> = {
  "linha-de-tendencia": {
    market:
      "Numa alta, cada recuo encontra compradores num preço um pouco mais alto que o anterior: quem ficou de fora aceita pagar mais para entrar. A linha liga esses pontos de demanda crescente. Quando ela é rompida, os compradores deixaram de defender os fundos no mesmo ritmo.",
    volume:
      "Numa LTA saudável, o volume cresce nas pernas de alta e diminui nos recuos até a linha. Recuos com volume crescente, ou altas com volume caindo, são os primeiros sinais de desgaste. O rompimento é mais confiável com aumento de volume, e isso é essencial quando uma LTB é rompida para cima.",
    trading:
      "Compre perto da linha numa LTA, com stop logo abaixo dela; o rompimento confirmado é o sinal de saída. Quanto mais tempo a linha dura e mais toques recebe, mais importante ela é. Linhas muito íngremes costumam ser rompidas cedo e dar lugar a uma linha mais plana (veja o Leque). Depois do rompimento, a distância que o preço se afastou da linha costuma ser percorrida do outro lado.",
    pitfalls:
      "Redesenhar a linha a cada violação para \"salvar\" a tendência. Tratar uma sombra intradiária como rompimento. Confiar numa linha com só dois pontos como se ela já estivesse validada.",
    source: CH4,
  },
  "suporte-e-resistencia": {
    market:
      "Pense em três grupos: os comprados, os vendidos e quem está de fora. Quando o preço sobe a partir de uma região de suporte, os comprados querem comprar mais num recuo, os vendidos querem sair no zero a zero e quem está de fora quer uma segunda chance. Todos esperam o recuo para comprar, e é isso que cria o suporte. Se a região é rompida para baixo, os mesmos grupos passam a querer vender quando o preço voltar ali: o suporte vira resistência.",
    volume:
      "A força de um nível depende de quanto se negociou nele, medido de três formas: o tempo que o preço passou ali (semanas pesam mais que dias), o volume negociado (nível formado com volume alto é mais importante) e quão recente foi. O rompimento de um nível importante deve vir com aumento de volume.",
    trading:
      "Compre perto do suporte com stop um pouco abaixo; realize perto da resistência. Números redondos (10, 20, 50, 100) funcionam como níveis psicológicos: deixe ordens de compra um pouco acima de um suporte redondo e de venda um pouco abaixo de uma resistência redonda. Quanto maior a penetração do nível, maior a chance de ele inverter de papel.",
    pitfalls:
      "Tratar o nível como uma linha exata, quando ele é uma zona. Deixar o stop exatamente no número redondo, onde muita gente deixa o seu. Dar a um nível antigo e pouco negociado a mesma importância de um nível recente e negociado com volume.",
    source: CH4,
  },
  pullback: {
    market:
      "Depois de um rompimento, quem ficou do lado errado aproveita o retorno ao nível para sair perto do preço de entrada, e quem perdeu o rompimento aproveita para entrar. Se o nível rompido segura, a troca de papel está confirmada.",
    volume:
      "O retorno deve vir com volume baixo, e a retomada com volume maior. Rompimento com volume muito alto diminui a chance de pullback, porque mostra pressão forte; rompimento com volume fraco aumenta essa chance. O pullback é mais comum depois de rompimentos de alta, em fundos, do que em topos.",
    trading:
      "Entrar no pullback, com stop do outro lado do nível rompido, tem risco menor que entrar no rompimento. Em padrões como o OCO, esperar o retorno à linha de pescoço é uma tática clássica. Uma alternativa é entrar com parte da posição no rompimento e completar no pullback.",
    pitfalls:
      "Esperar sempre pelo pullback: ele nem sempre acontece e às vezes é mínimo. Confundir pullback com falha: se o preço fecha de volta do outro lado do nível, com volume, o rompimento falhou.",
    source: CH5,
  },
  rompimento: {
    market:
      "Um rompimento verdadeiro mostra que um lado assumiu o controle. Os falsos acontecem quando ordens de stop são disparadas sem que haja interesse novo para sustentar o movimento, e o preço volta para dentro do padrão.",
    volume:
      "O volume deve aumentar no rompimento, principalmente para cima: o mercado pode cair só pela falta de compradores, mas só sobe se a demanda superar a oferta. Rompimento para cima com volume baixo, seguido de queda com volume alto, é uma combinação negativa: a \"armadilha de touro\".",
    trading:
      "Use filtros: de preço (fechamento de 1% a 3% além da linha; o RiskTrade usa 1%), de tempo (dois fechamentos seguidos do outro lado) e o próprio fechamento, nunca a sombra. Entre no fechamento confirmado ou no pullback. Os filtros reduzem sinais falsos, mas atrasam a entrada: é sempre um compromisso.",
    pitfalls:
      "Agir em rompimento intradiário. Usar um filtro grande demais num ativo pouco volátil (entra tarde) ou pequeno demais num ativo muito volátil (entra em ruído).",
    source: CH4,
  },
  canal: {
    market:
      "O preço oscila num ritmo regular entre a demanda, na linha de tendência, e a realização de lucros, na linha do canal. Enquanto esse ritmo se mantém, a tendência está saudável.",
    volume:
      "O volume deve ser maior nas pernas a favor da tendência e menor nos recuos. Quando uma perna não alcança mais a linha do canal, principalmente com volume em queda, a tendência está perdendo força.",
    trading:
      "Realize parte da posição perto da linha do canal e compre perto da linha de tendência. Se o preço não chega a um lado do canal, aumenta a chance de romper o outro. Romper a linha do canal no sentido da tendência indica aceleração. Depois de rompido, o canal costuma projetar sua própria largura.",
    pitfalls:
      "Operar contra a tendência a partir da linha do canal (vender no topo do canal numa alta): é arriscado e costuma sair caro. A linha de tendência é mais importante e confiável que a linha do canal.",
    source: CH4,
  },
  leque: {
    market:
      "Cada linha rompida mostra que a tendência perdeu inclinação: o mercado ainda tenta seguir, mas com menos força. Depois de três tentativas frustradas, o lado oposto assumiu o controle. É a mesma ideia do \"número três\" que aparece em toda a análise técnica.",
    volume:
      "Como em qualquer reversão, o rompimento da 3ª linha ganha força com aumento de volume. Quando a reversão é para cima, esse aumento é essencial; nas reversões de topo ele é desejável, mas menos decisivo.",
    trading:
      "Não antecipe a reversão antes de a 3ª linha ser rompida. As linhas já rompidas costumam inverter de papel e servir de suporte ou resistência no pullback, o que ajuda a posicionar o stop.",
    pitfalls:
      "Contar como nova linha um simples ajuste, sem um rompimento real da anterior. Aplicar o princípio a movimentos curtos e ruidosos: ele foi pensado para tendências maduras.",
    source: CH4,
  },
  retracoes: {
    market:
      "As tendências avançam em ondas: realizações de lucro e entradas de quem ficou de fora fazem o preço devolver parte do movimento antes de seguir. Dow já observava que as correções intermediárias devolvem de 1/3 a 2/3 do movimento, mais frequentemente cerca de 50%.",
    volume:
      "Uma correção saudável acontece com volume menor que o da perna anterior. Se o volume cresce durante a correção, ela pode ser o começo de uma reversão.",
    trading:
      "Numa alta, a zona de compra fica entre 38% e 62%. Correção rasa, perto de 38%, indica tendência forte; além de 62% a 66%, a tendência fica em dúvida. Procure confluência com um suporte anterior, uma linha de tendência ou um candle de reversão, e deixe o stop abaixo da zona seguinte.",
    pitfalls:
      "Comprar no nível sem nenhuma confirmação: o preço pode atravessá-lo. Medir a partir de pontos arbitrários: use topos e fundos relevantes.",
    source: CH4,
  },
  "linhas-de-velocidade": {
    market:
      "As linhas medem o ritmo da tendência, combinando preço e tempo. Enquanto o preço respeita a linha de 2/3, o ritmo original está intacto; abaixo dela, a tendência desacelerou.",
    volume:
      "Recuos até a linha de 2/3 com volume fraco são saudáveis. O rompimento com volume forte sugere que o ritmo se perdeu.",
    trading:
      "Se a correção para na linha de 2/3, é ponto de compra. Se ela é rompida, o alvo passa a ser a linha de 1/3; rompida também a de 1/3, a reversão é provável. As linhas rompidas viram resistência no repique. Redesenhe as linhas sempre que o preço fizer um novo extremo.",
    pitfalls: "Esquecer de redesenhar após um novo topo. Usar a ferramenta em movimentos curtos e ruidosos.",
    source: CH4,
  },
  oco: {
    market:
      "No ombro esquerdo a alta ainda é forte. Na cabeça o preço faz um novo topo, mas com menos volume: os compradores estão mais fracos. No ombro direito o preço nem chega à cabeça, o que já forma um topo descendente. O rompimento da linha de pescoço completa a outra metade: um fundo descendente. Está formada a nova tendência de baixa.",
    volume:
      "A cabeça costuma ter volume menor que o ombro esquerdo, e o ombro direito, volume nitidamente menor que os dois. Esse é o sinal de volume mais importante do padrão. O volume aumenta no rompimento do pescoço, cai no pullback e volta a aumentar na retomada da queda. Em topos, o volume no rompimento é desejável, mas menos crítico que em fundos.",
    trading:
      "Venda no fechamento abaixo do pescoço ou no pullback até ele, com stop acima do ombro direito. O alvo mínimo é a distância da cabeça ao pescoço, projetada a partir do rompimento; outra forma é dobrar a primeira perna de queda. Se houver um suporte relevante pouco antes do alvo, ajuste o alvo para ele.",
    pitfalls:
      "Antecipar o padrão antes do rompimento do pescoço. Aceitar um ombro direito com volume forte. Um fechamento de volta acima do pescoço depois do rompimento invalida o padrão e é sinal de força.",
    source: CH5,
  },
  "oco-invertido": {
    market:
      "É o espelho do OCO, mas com uma diferença de dinâmica: o mercado pode cair só por falta de compradores, porém só sobe se a demanda superar a oferta. Por isso o fundo exige mais provas de força que o topo.",
    volume:
      "Na primeira metade o padrão de volume é parecido com o do topo: a cabeça tem volume um pouco menor que o ombro esquerdo. A alta que parte da cabeça já mostra volume crescente, muitas vezes maior que o da alta do ombro esquerdo. O recuo ao ombro direito vem com volume baixo, e o rompimento do pescoço precisa de uma explosão de volume: sem ela, desconfie. O pullback, mais comum em fundos, deve vir com volume baixo.",
    trading:
      "Compre no rompimento do pescoço ou no pullback até ele, com stop abaixo do ombro direito. Traders mais agressivos começam a comprar ainda no ombro direito (num recuo de 50% a 66% da alta que partiu da cabeça, ou no nível do ombro esquerdo) e completam a posição no rompimento. O alvo é a altura do padrão, projetada para cima.",
    pitfalls: "Comprar um rompimento sem aumento de volume. Entrar cedo no ombro direito sem stop definido.",
    source: CH5,
  },
  "topo-duplo": {
    market:
      "O mercado tenta superar a máxima e falha; a segunda tentativa falha no mesmo nível, mostrando que a oferta segura ali. O rompimento do fundo intermediário completa topos e fundos descendentes.",
    volume:
      "O volume costuma ser maior no primeiro topo e menor no segundo, e aumenta no rompimento do fundo intermediário.",
    trading:
      "Venda no fechamento abaixo do fundo intermediário. O pullback até ele é comum. O alvo é a altura do padrão, projetada a partir do rompimento. Os topos não precisam ser exatamente iguais.",
    pitfalls:
      "Chamar de topo duplo qualquer recuo depois de um teste da máxima. Na maioria das vezes esse recuo é só uma correção e a tendência continua. O padrão só se confirma com o rompimento do fundo intermediário.",
    source: CH5,
  },
  "fundo-duplo": {
    market:
      "O mercado testa duas vezes o mesmo fundo e a demanda segura nas duas. O rompimento do topo intermediário completa topos e fundos ascendentes.",
    volume:
      "O volume costuma ser menor no segundo fundo. No rompimento do topo intermediário, o aumento de volume é mais importante que no topo duplo, porque é uma reversão para cima.",
    trading:
      "Compre no fechamento acima do topo intermediário ou no pullback até ele, que é mais comum em fundos. O alvo é a altura do padrão, projetada para cima.",
    pitfalls:
      "Comprar no segundo fundo antes da confirmação: a queda pode continuar. Aceitar um rompimento sem volume.",
    source: CH5,
  },
  "triangulo-simetrico": {
    market:
      "É indecisão: compradores e vendedores reduzem a amplitude das oscilações até que um lado vença. Costuma ser uma pausa que segue a tendência anterior.",
    volume:
      "O volume diminui à medida que as oscilações se estreitam, como em todo padrão de consolidação, e aumenta claramente no rompimento. Durante a formação há uma pista: numa alta, o volume tende a ser um pouco maior nas subidas internas que nas descidas. O rompimento para cima exige volume.",
    trading:
      "O rompimento ideal acontece entre metade e três quartos da largura do triângulo, e o ápice dá uma janela de tempo: se as linhas se encontram em 20 semanas, o rompimento deve vir entre a 13ª e a 15ª. O alvo é a base projetada a partir do rompimento. O pullback até a linha rompida é comum e deve vir com volume baixo.",
    pitfalls:
      "Confiar num rompimento muito perto do ápice: ali o padrão perde força. Apostar na direção antes do rompimento.",
    source: CH6,
  },
  "triangulo-ascendente": {
    market:
      "Os compradores estão mais agressivos que os vendedores: aceitam pagar cada vez mais (fundos subindo), enquanto a oferta segura um preço fixo. Quando essa oferta se esgota, o preço rompe para cima.",
    volume:
      "O volume diminui durante a formação, mas tende a ser maior nas subidas internas que nas descidas. O rompimento para cima deve vir com aumento claro de volume, e o pullback à resistência rompida, com volume baixo.",
    trading:
      "Compre no fechamento acima da resistência plana ou no pullback até ela. O alvo é a altura da base, projetada a partir do rompimento.",
    pitfalls: "O viés é de alta, mas não é garantia: um fechamento abaixo da linha inferior invalida o padrão.",
    source: CH6,
  },
  "triangulo-descendente": {
    market:
      "Os vendedores estão mais agressivos que os compradores: aceitam receber cada vez menos (topos caindo), enquanto a demanda segura um preço fixo. Quando essa demanda se esgota, o preço rompe para baixo.",
    volume:
      "O volume diminui durante a formação, mas tende a ser maior nas descidas internas que nos repiques. O rompimento costuma vir com aumento de volume, embora em quedas o volume seja menos decisivo que em altas.",
    trading:
      "Venda no fechamento abaixo do suporte plano ou no pullback até ele, que deve encontrar resistência. O alvo é a altura da base, projetada para baixo.",
    pitfalls: "Um fechamento acima da linha superior invalida o padrão e pode virar um sinal de alta.",
    source: CH6,
  },
  bandeira: {
    market:
      "O mastro é um impulso quase vertical. A bandeira é um descanso curto, em que parte de quem comprou realiza lucro sem que apareça uma pressão vendedora de verdade. Por isso a consolidação é estreita e inclinada contra a tendência.",
    volume:
      "O mastro vem com volume alto, o volume \"seca\" durante a bandeira e volta a crescer no rompimento. Esse secar do volume é um requisito do padrão. Em tendências de baixa, as bandeiras duram ainda menos, de uma a duas semanas.",
    trading:
      "Entre no rompimento da linha superior (em alta) com stop abaixo da bandeira. Para o alvo, meça o mastro desde o ponto do rompimento original e projete essa distância a partir do rompimento da bandeira. Como a bandeira costuma aparecer na metade do movimento, diz-se que ela tremula a meio mastro.",
    pitfalls:
      "Se a consolidação passa de umas três semanas, ou se o volume não diminui, provavelmente não é uma bandeira. Uma bandeira inclinada a favor da tendência é suspeita.",
    source: CH6,
  },
  flamula: {
    market:
      "É o mesmo descanso depois de um mastro, mas a consolidação forma um pequeno triângulo simétrico em vez de um canal: compradores e vendedores reduzem a amplitude por poucos dias.",
    volume:
      "Mastro com volume alto, volume baixo durante a flâmula e aumento no rompimento. Na alta, o aumento de volume no rompimento é ainda mais importante.",
    trading:
      "Entre no rompimento com stop do outro lado da flâmula. O alvo é o tamanho do mastro, projetado a partir do rompimento. A flâmula costuma durar de uma a três semanas.",
    pitfalls: "Uma flâmula que se alonga muito vira um triângulo comum, com outras regras de alvo e de tempo.",
    source: CH6,
  },
  "cunha-descendente": {
    market:
      "O preço segue fazendo topos e fundos mais baixos, mas com amplitude cada vez menor: o movimento de baixa perde força. Como a cunha se inclina contra a tendência de alta, ela costuma ser uma correção que termina com a retomada. A regra vale onde ela aparecer: cunha descendente é de alta.",
    volume:
      "O volume diminui durante a formação e precisa aumentar no rompimento para cima.",
    trading:
      "Compre no fechamento acima da linha superior, com stop abaixo do último fundo da cunha. A cunha leva mais tempo que uma bandeira, normalmente de um a três meses. Um alvo mínimo comum é a volta ao início da cunha.",
    pitfalls:
      "Confundir a cunha com um canal (linhas paralelas) ou com um triângulo (linhas em direções opostas). No fim de uma longa queda, a mesma figura pode marcar uma reversão, não uma continuação.",
    source: CH6,
  },
  "cunha-ascendente": {
    market:
      "O preço segue fazendo topos e fundos mais altos, mas com amplitude cada vez menor: o repique perde força. Numa tendência de baixa, a cunha é um repique contra a tendência que costuma terminar com a retomada da queda. Onde aparecer, a cunha ascendente é de baixa.",
    volume:
      "O volume diminui durante a formação. O rompimento para baixo costuma vir com aumento de volume, embora em quedas o volume seja menos decisivo.",
    trading:
      "Venda no fechamento abaixo da linha inferior, com stop acima do último topo da cunha. Um alvo mínimo comum é a volta ao início da cunha.",
    pitfalls:
      "No topo de uma longa alta, uma cunha ascendente pode marcar a reversão da tendência. Não a confunda com um canal de alta saudável, que tem linhas paralelas.",
    source: CH6,
  },
  "gap-comum": {
    market:
      "É um intervalo sem negócios dentro de uma faixa lateral, geralmente por pouca liquidez ou por uma notícia sem importância. Não muda o equilíbrio entre compradores e vendedores.",
    volume: "Aparece com volume baixo e costuma ser fechado em poucos dias.",
    trading: "Não tem valor de previsão: não opere só por causa dele.",
    pitfalls: "Confundir um gap comum com um gap de rompimento. O de rompimento sai de uma formação e vem com volume alto.",
    source: CH4,
  },
  "gap-de-rompimento": {
    market:
      "O preço sai de uma formação ou rompe um nível importante com um salto: a demanda (ou a oferta) nova é tão forte que nem houve negócios no meio do caminho.",
    volume:
      "Vem com volume alto. Quanto maior o volume depois do gap, menor a chance de ele ser fechado.",
    trading:
      "A borda do gap passa a servir de suporte (numa alta). Entre no rompimento ou num recuo até o gap, com stop abaixo dele.",
    pitfalls:
      "Um gap de rompimento que é fechado logo, especialmente com volume, enfraquece o sinal. Às vezes o preço testa a borda do gap antes de seguir.",
    source: CH4,
  },
  "gap-de-continuacao": {
    market:
      "O mercado está andando sem esforço, no meio de um movimento forte, e salta de novo. Também é chamado de gap de medição porque costuma aparecer perto da metade do movimento.",
    volume: "Costuma aparecer com volume moderado, sem o exagero dos gaps de rompimento ou de exaustão.",
    trading:
      "Meça a distância percorrida desde o rompimento original até o gap e projete o mesmo tanto a partir dele. Em outras palavras, dobre o que já foi percorrido. O gap serve de suporte durante a alta.",
    pitfalls: "Se ele for fechado, provavelmente não era um gap de continuação, mas de exaustão.",
    source: CH4,
  },
  "gap-de-exaustao": {
    market:
      "Depois de uma alta longa, entra o último grupo de compradores, muitas vezes por euforia, e o preço salta. Não sobra ninguém para comprar mais acima, e o movimento perde fôlego.",
    volume: "Costuma vir com volume muito alto, um clímax de compras.",
    trading:
      "Um fechamento abaixo do gap, em poucos dias, é sinal de fraqueza e confirma o esgotamento. Às vezes o preço anda de lado por alguns dias ou semanas e depois abre um gap para baixo, formando uma ilha de reversão.",
    pitfalls:
      "Só dá para distinguir exaustão de continuação depois, quando o gap é fechado. Não venda a descoberto só porque apareceu um gap numa tendência longa.",
    source: CH4,
  },
  "ilha-de-reversao": {
    market:
      "Um gap de exaustão leva o preço a um nível em que os compradores se esgotam. Quando o mercado abre um gap na direção contrária, quem comprou durante a ilha fica preso com prejuízo.",
    volume: "O sinal ganha força com volume alto no segundo gap.",
    trading:
      "Venda (num topo) no segundo gap, com stop acima da ilha. É um sinal de reversão de curto prazo, mais forte quando aparece depois de uma tendência longa.",
    pitfalls: "Os dois gaps precisam acontecer em níveis parecidos. Uma ilha pequena, no meio de uma faixa lateral, tem pouco significado.",
    source: CH4,
  },
  volume: {
    market:
      "O volume mede a intensidade, ou a urgência, por trás do movimento de preço. Preço e volume medem a mesma coisa, a pressão de compra ou de venda, de dois jeitos diferentes. Por isso se diz que o volume precede o preço: a perda de pressão costuma aparecer no volume antes de aparecer no preço.",
    volume:
      "Regra geral: o volume cresce no sentido da tendência. Preço subindo com volume subindo indica mercado forte; preço subindo com volume caindo, mercado fraco. Preço caindo com volume subindo é fraco; preço caindo com volume caindo indica que a pressão vendedora está acabando. Nos extremos aparecem os clímax: uma disparada final com volume enorme num topo, ou um despencar com volume enorme seguido de repique num fundo.",
    trading:
      "Use o volume para confirmar, não para gerar o sinal. O preço vem primeiro. O RiskTrade mostra no resumo o volume do dia contra a média de 20 pregões, e o painel de volume abaixo do gráfico colore cada barra conforme o candle.",
    pitfalls:
      "Ler o volume isoladamente. Esquecer que em dias de feriado, véspera ou meio pregão o volume é naturalmente baixo.",
    source: CH7,
  },
  "interesse-aberto": {
    market:
      "Um contrato só nasce quando um comprador novo encontra um vendedor novo: o interesse aberto sobe um. Quando os dois encerram posições, cai um. Se um sai e outro entra no lugar, não muda. Por isso ele mede quanto dinheiro está comprometido no mercado: subindo, entra dinheiro novo; caindo, posições estão sendo fechadas.",
    volume:
      "Volume e interesse aberto se leem juntos: volume é quantos contratos trocaram de mãos no dia, interesse aberto é quantos continuam abertos. Subindo junto com o preço, os dois confirmam a tendência. Uma alta com volume forte e interesse aberto caindo é recompra de vendidos, não demanda nova; no fim de grandes altas (blowoff), essa queda costuma ser o aviso.",
    trading:
      "Confirme a tendência: numa alta, prefira entradas com interesse aberto crescente. Interesse aberto que cresce durante uma consolidação aumenta a força do rompimento, porque muitos ficam do lado errado e precisam zerar. Interesse aberto muito alto num topo é perigoso: se o preço cai de repente, os comprados recentes liquidam e aceleram a queda.",
    pitfalls:
      "Olhe a tendência de semanas, não a variação de um dia: logo após um rompimento, o interesse aberto costuma cair um pouco, porque quem estava errado está saindo. Há também quedas sazonais perto do vencimento dos contratos. O relatório da CFTC é semanal, com a posição de terça divulgada na sexta, então o dado sempre chega com alguns dias de atraso.",
    source: `${CH7}; relatório Commitments of Traders (CFTC)`,
  },
  obv: {
    market:
      "O OBV (Joseph Granville, 1963) soma o volume dos dias de alta e subtrai o dos dias de baixa. Mostra num único traço se o volume está entrando ou saindo do papel.",
    volume:
      "Importa a direção da linha, não o valor, que muda conforme o período analisado. O OBV deve acompanhar o preço: topos e fundos mais altos numa alta. Quando ele rompe antes do preço, pode antecipar o movimento.",
    trading:
      "Confirme rompimentos de preço com rompimentos do OBV na mesma direção, e desconfie quando o preço sobe e o OBV não. O painel de OBV do RiskTrade já marca as divergências.",
    pitfalls:
      "O OBV atribui o volume do dia inteiro ao sinal do fechamento: um dia que fecha um centavo acima conta todo o volume como de compra. Por isso existem variações que ponderam o volume pela variação do preço.",
    source: CH7,
  },
  "divergencia-de-volume": {
    market:
      "O preço faz um novo topo, mas com cada vez menos gente comprando. O movimento continua por inércia, mas a pressão de compra está diminuindo.",
    volume:
      "Há divergência quando um topo anterior é superado com volume (ou OBV) menor. Se, além disso, o volume começa a crescer nos recuos, a alta está em perigo. O mesmo vale, invertido, para as quedas.",
    trading:
      "Trate a divergência como um alerta para proteger lucros ou apertar o stop, não como um sinal de venda. Espere a confirmação pelo preço: rompimento de uma linha de tendência ou de um fundo anterior.",
    pitfalls:
      "Vender só pela divergência: tendências fortes podem mostrar várias divergências seguidas antes de virar. Comparar topos que não são equivalentes.",
    source: CH7,
  },
};
