import type { BananaExplanation } from "./types";

/**
 * Modo banana: cada termo explicado como se o mercado fosse uma feira de bananas. Os
 * personagens são sempre os mesmos: Dona Zica, produtora, vende cachos; Seu Tonho, dono de
 * quitanda, compra. O preço é o do cacho, escrito na lousa da feira; o volume, quantos cachos
 * trocaram de mão.
 */
export const BANANAS: Record<string, BananaExplanation> = {
  "linha-de-tendencia": {
    scene:
      "Há semanas o cacho de banana vem encarecendo na feira. De vez em quando o preço dá uma recuada, mas Seu Tonho sempre aparece para comprar, e cada vez num preço um pouco mais alto que da vez anterior: R$ 8, depois R$ 9, depois R$ 10.",
    concept:
      "Pegue uma régua e ligue esses pontos onde as quedas pararam. A linha inclinada que sai dali é a linha de tendência: mostra o piso da banana subindo com o tempo, porque quem quer comprar aceita pagar cada vez mais.",
    rule:
      "Dois fundos bastam para riscar a linha, mas só um terceiro toque confirma. Quanto mais vezes ela segurar e quanto mais tempo durar, mais confiável. Se o preço fechar abaixo dela, Seu Tonho parou de defender o piso.",
    moral: "Enquanto quem compra pagar cada vez mais nas quedas, a banana continua subindo.",
  },
  "suporte-e-resistencia": {
    scene:
      "Toda vez que o cacho cai para R$ 8, Seu Tonho e os outros quitandeiros acham barato e enchem a carroça: o preço para de cair. Toda vez que chega a R$ 12, Dona Zica e os outros produtores acham ótimo e despejam cachos na banca: o preço para de subir.",
    concept:
      "R$ 8 é o suporte, o chão onde a demanda aparece. R$ 12 é a resistência, o teto onde a oferta aparece. A banana fica quicando entre os dois enquanto ninguém muda de ideia.",
    rule:
      "Quanto mais vezes o preço bater num nível, e com mais cachos negociados ali, mais forte ele é. E os papéis se invertem: se a banana rompe os R$ 12, quem vendeu ali se arrepende e volta a comprar se o preço recuar até R$ 12. O teto virou chão.",
    moral: "Preço tem memória: a feira lembra onde já comprou barato e onde já vendeu caro.",
  },
  pullback: {
    scene:
      "O cacho finalmente passou dos R$ 12 e foi até R$ 13. Aí deu uma recuada e voltou a R$ 12, justamente o antigo teto.",
    concept:
      "Esse retorno é o pullback: o preço volta para conferir se o teto antigo agora aguenta como piso. Quem perdeu o rompimento ganha uma segunda chance de comprar no nível certo.",
    rule:
      "O pullback é saudável quando volta com feira vazia (pouco volume) e segura no antigo teto. Se o preço afundar de novo abaixo de R$ 12, o rompimento era falso.",
    moral: "Depois de pular o muro, a banana às vezes volta para encostar nele antes de seguir viagem.",
  },
  rompimento: {
    scene:
      "Por meses, ninguém conseguia vender cacho acima de R$ 12: Dona Zica sempre tinha estoque ali. Um dia chega a notícia de uma geada nos bananais do Sul, e a fila de quitandeiros dobra o quarteirão. O cacho é vendido a R$ 12,50, depois R$ 13.",
    concept:
      "Isso é o rompimento: o preço atravessa um nível que segurava há tempos, porque o equilíbrio entre quem compra e quem vende mudou de verdade.",
    rule:
      "Desconfie de pulinhos. Rompimento confiável fecha além do nível com folga (cerca de 3%), se mantém por uns dois dias e vem com fila grande, ou seja, volume alto. Sem isso, pode ser só um susto que volta para dentro.",
    moral: "Muro de verdade só cai com muita gente empurrando.",
  },
  canal: {
    scene:
      "O preço da banana sobe com calma, apoiado na linha de tendência. E toda vez que se afasta dela uma certa distância, Seu Tonho aproveita para revender parte do estoque e o preço recua.",
    concept:
      "Riscando uma segunda régua paralela pelos topos, você tem um corredor inclinado: o canal. A banana passeia de um lado para o outro dentro dele, como bola numa calha.",
    rule:
      "Comprar perto do chão do canal e realizar perto do teto é o uso clássico. O aviso vem quando a banana não consegue mais chegar até o teto: a força está acabando, e o chão tende a ceder depois.",
    moral: "Banana em canal anda em zigue-zague, mas sempre na mesma direção, até cansar.",
  },
  leque: {
    scene:
      "A alta da banana começa a perder o fôlego. A linha de tendência é rompida, mas o preço não desaba: só passa a subir mais devagar, e você risca uma segunda linha, menos inclinada. Ela também cede, e vem uma terceira, quase deitada.",
    concept:
      "As três linhas partindo do mesmo ponto parecem as varetas de um leque abrindo. Cada uma mostra a alta perdendo velocidade.",
    rule: "A regra é a dos três: quando a terceira linha do leque é rompida, a tendência acabou.",
    moral: "Banana que sobe cada vez mais devagar está avisando que vai parar.",
  },
  retracoes: {
    scene:
      "O cacho subiu de R$ 10 para R$ 20 em poucas semanas. Agora recua, e a feira toda se pergunta: até onde vai essa queda?",
    concept:
      "As retrações medem quanto da subida a correção devolve. O normal é devolver entre um terço e dois terços, ou seja, voltar para algo entre R$ 16,67 e R$ 13,33. O mais comum é devolver metade: R$ 15. Quem usa Fibonacci olha 38,2% e 61,8%.",
    rule:
      "Essas faixas são boas regiões para esperar Seu Tonho voltar às compras. Se a correção devolver mais de dois terços da subida, a alta inteira fica em risco.",
    moral: "Toda subida de banana devolve um pedaço; preocupe-se quando devolver quase tudo.",
  },
  "linhas-de-velocidade": {
    scene:
      "O cacho de banana subiu de R$ 10 para R$ 19. Você divide essa subida em três partes iguais e marca R$ 13 e R$ 16 na lousa da feira.",
    concept:
      "Ligando o fundo da subida (R$ 10) a esses dois pontos no topo, saem duas linhas que mostram a velocidade da alta: a de dois terços, mais rápida, e a de um terço, mais lenta.",
    rule:
      "Na correção, a banana costuma parar na linha de dois terços. Se a rompe, tende a descer até a de um terço. Se rompe também a de um terço, o preço tende a voltar até onde a alta começou.",
    moral: "Medindo a velocidade da subida, você descobre em que degrau a queda deve parar.",
  },
  oco: {
    scene:
      "A banana sobe até R$ 15 e recua para R$ 13. Sobe de novo até R$ 18, um recorde, mas com a fila menor que antes, e recua outra vez para R$ 13. Na terceira tentativa, só chega a R$ 15, com a feira quase vazia.",
    concept:
      "São três montes: um ombro, uma cabeça mais alta e outro ombro. A linha que liga os vales em R$ 13 é o pescoço. O desenho mostra os compradores perdendo a força a cada tentativa.",
    rule:
      "O padrão só vale quando a banana fecha abaixo do pescoço (R$ 13). O alvo é a distância da cabeça ao pescoço (R$ 5) projetada para baixo: R$ 8. Muitas vezes o preço volta para encostar no pescoço por baixo antes de cair.",
    moral: "Quando o recorde vem com menos gente e o próximo nem chega lá, a alta acabou.",
  },
  "oco-invertido": {
    scene:
      "No fundo de uma longa queda, a banana cai a R$ 7, volta a R$ 9, afunda até R$ 5, volta a R$ 9 e, na terceira descida, só vai até R$ 7.",
    concept:
      "É o ombro-cabeça-ombro de ponta-cabeça: os vendedores tentam três vezes e perdem força. O pescoço agora é o teto em R$ 9.",
    rule:
      "Vale quando a banana rompe o pescoço para cima, e aqui a fila grande é obrigatória: sem volume forte no rompimento, desconfie. O alvo é a profundidade da cabeça (R$ 4) somada acima do pescoço: R$ 13.",
    moral: "Fundo bom se constrói com vendedores cansando e compradores chegando em peso.",
  },
  "topo-duplo": {
    scene:
      "A banana sobe até R$ 20 e Dona Zica despeja cachos: o preço cai para R$ 16. Os compradores tentam de novo, chegam aos mesmos R$ 20 e Dona Zica despeja outra vez.",
    concept:
      "Dois topos no mesmo preço formam um M: a feira bateu duas vezes no mesmo teto e não passou. É sinal de que, ali, a oferta é maior que a vontade de comprar.",
    rule:
      "Ainda não é padrão enquanto a banana não fechar abaixo do vale entre os topos (R$ 16). Quando fecha, o alvo é a altura do M (R$ 4) projetada para baixo: R$ 12.",
    moral: "Bater duas vezes no mesmo teto é aviso; furar o chão do meio é confirmação.",
  },
  "fundo-duplo": {
    scene:
      "A banana cai até R$ 8, Seu Tonho enche a carroça e o preço sobe para R$ 11. Volta a cair, chega aos mesmos R$ 8, e Seu Tonho compra de novo.",
    concept:
      "Dois fundos no mesmo preço formam um W: a feira testou duas vezes o chão e ele aguentou. Ali, a demanda venceu.",
    rule:
      "Só vale quando a banana rompe o pico entre os fundos (R$ 11), de preferência com fila grande. O alvo é a altura do W (R$ 3) somada acima: R$ 14.",
    moral: "Chão que aguenta duas vezes merece respeito, mas só compre quando o preço sair do buraco.",
  },
  "triangulo-simetrico": {
    scene:
      "Seu Tonho e Dona Zica estão pechinchando. Ela baixa um pouco o preço a cada rodada, ele sobe um pouco a oferta. Os topos ficam mais baixos e os fundos mais altos, e a briga vai se apertando.",
    concept:
      "As duas linhas convergindo formam o triângulo simétrico: uma pausa de indecisão. Na maioria das vezes, quando a pechincha termina, a banana segue na direção em que já vinha.",
    rule:
      "O rompimento costuma vir entre dois terços e três quartos do caminho até a ponta, com volume crescendo. O alvo é a altura da boca do triângulo projetada a partir do rompimento. Se chegar até a ponta sem romper, o padrão perde força.",
    moral: "Pechincha apertada termina com alguém cedendo, normalmente quem já estava perdendo.",
  },
  "triangulo-ascendente": {
    scene:
      "Dona Zica tem uma montanha de cachos e não vende nem um centavo abaixo de R$ 12. Mas os quitandeiros estão ansiosos: aparecem para comprar cada vez mais cedo, a R$ 9, depois R$ 10, depois R$ 11.",
    concept:
      "Teto reto e fundos subindo formam o triângulo ascendente. Os compradores estão apertando a vendedora contra a parede.",
    rule:
      "O viés é de alta: quando o estoque de Dona Zica a R$ 12 acaba, a banana dispara. Confirme com fechamento acima do teto e fila grande. O alvo é a altura do triângulo somada ao teto.",
    moral: "Quem só vende a um preço fixo uma hora fica sem banana, e aí o preço sobe.",
  },
  "triangulo-descendente": {
    scene:
      "Seu Tonho decidiu que compra todo cacho oferecido a R$ 8. Mas os produtores estão aflitos para vender e aceitam cada vez menos: R$ 11, depois R$ 10, depois R$ 9.",
    concept:
      "Chão reto e topos descendo formam o triângulo descendente. Os vendedores estão empurrando o preço contra o depósito de Seu Tonho.",
    rule:
      "O viés é de baixa: quando o depósito de Seu Tonho enche e ele para de comprar a R$ 8, o chão cede. Confirme com fechamento abaixo do chão. O alvo é a altura do triângulo projetada para baixo.",
    moral: "Comprador com depósito limitado não segura o preço para sempre.",
  },
  bandeira: {
    scene:
      "Chega a notícia de praga nos bananais e o cacho dispara de R$ 10 para R$ 15 em três dias, com fila enorme. Depois a feira respira: por uma semana o preço recua devagarinho, num corredor estreito e levemente inclinado para baixo, com pouca gente negociando.",
    concept:
      "A subida rápida é o mastro, e o descanso em retângulo é a bandeira. É só a feira recuperando o fôlego antes de continuar na mesma direção.",
    rule:
      "A bandeira é curta (de uma a três semanas) e quieta, com volume baixo. Rompendo o corredor na direção do mastro, com a fila voltando, o alvo é o tamanho do mastro (R$ 5) somado a partir do rompimento.",
    moral: "Depois de correr muito, a banana para para tomar água, e volta a correr.",
  },
  flamula: {
    scene:
      "Mesma história da bandeira: a banana dispara de R$ 10 para R$ 15. Só que no descanso o preço não anda num corredor; ele vai se apertando, cada vaivém menor que o anterior.",
    concept:
      "A flâmula é a bandeira com o pano em forma de triângulo: um triangulozinho simétrico no alto de um mastro.",
    rule:
      "Vale o mesmo da bandeira: dura poucas semanas, o volume seca durante o aperto e volta forte no rompimento. O alvo é o tamanho do mastro medido a partir do rompimento.",
    moral: "Seja corredor ou triângulo, a pausa curta depois de uma arrancada costuma continuar a arrancada.",
  },
  "cunha-descendente": {
    scene:
      "A banana vem caindo, mas cada queda é menor que a anterior: primeiro despenca R$ 3, depois R$ 2, depois R$ 1. Os topos e os fundos descem, mas os fundos descem mais devagar.",
    concept:
      "As duas linhas descendo e se aproximando formam a cunha descendente. Os vendedores ainda empurram, mas estão cansando.",
    rule:
      "O viés é de alta: o normal é a banana romper a linha de cima. Numa alta, a cunha descendente é só uma pausa; no fim de uma queda, pode marcar a virada. Espere o rompimento antes de comprar.",
    moral: "Queda que perde força a cada rodada está perto de acabar.",
  },
  "cunha-ascendente": {
    scene:
      "A banana vem subindo, mas cada alta rende menos: primeiro R$ 3, depois R$ 2, depois R$ 1. Os topos e os fundos sobem, mas os topos sobem mais devagar.",
    concept:
      "As duas linhas subindo e se aproximando formam a cunha ascendente. Os compradores ainda empurram, mas estão sem fôlego.",
    rule:
      "O viés é de baixa: o normal é a banana romper a linha de baixo. Numa queda, a cunha ascendente é só um respiro; no fim de uma alta, pode marcar o topo. Espere o rompimento antes de vender.",
    moral: "Subida que rende cada vez menos está pedindo para descer.",
  },
  "gap-comum": {
    scene:
      "A feira fecha com o cacho a R$ 10 e, no dia seguinte, abre a R$ 10,20. Ninguém negociou banana entre R$ 10 e R$ 10,20: ficou um buraquinho na lousa. Mas a feira estava parada, sem notícia nenhuma.",
    concept:
      "Esse buraco pequeno, num mercado sem direção e com pouca gente, é o gap comum. Ele acontece por acaso, sem nenhum motivo forte por trás.",
    rule: "Não significa nada: costuma ser fechado em poucos dias, quando o preço volta e passa pelo buraco.",
    moral: "Nem todo buraco na lousa é notícia; às vezes é só a feira cochilando.",
  },
  "gap-de-rompimento": {
    scene:
      "De madrugada sai a notícia de uma praga nos bananais. A feira, que há meses não passava de R$ 12, abre direto a R$ 13, pulando o teto inteiro, com fila virando a esquina.",
    concept:
      "O gap de rompimento é o salto que atravessa um nível importante e inaugura um movimento novo. Ninguém teve chance de vender no meio do caminho.",
    rule:
      "Ele vem com volume alto e costuma não ser fechado tão cedo. Inclusive, se a banana voltar e fechar o buraco, desconfie do rompimento.",
    moral: "Quando a feira pula o muro de madrugada, é porque mudou alguma coisa de verdade.",
  },
  "gap-de-continuacao": {
    scene:
      "A banana já vem subindo forte há semanas. No meio da corrida, a feira dá outro salto: fecha a R$ 15 e abre a R$ 15,80, com fila boa, mas sem histeria.",
    concept:
      "É o gap de continuação, também chamado de gap de medida: aparece no meio de um movimento acelerado e mostra que o pique continua.",
    rule:
      "Ele costuma marcar mais ou menos a metade do caminho. Medindo a distância do começo da alta até o buraco e somando a partir dele, você estima até onde a banana vai.",
    moral: "Buraco no meio da corrida diz que ainda falta mais ou menos o mesmo tanto.",
  },
  "gap-de-exaustao": {
    scene:
      "Depois de meses de alta, a feira vira euforia: todo mundo quer banana. Um dia o cacho abre num salto, de R$ 25 para R$ 27. Mas em três dias o preço volta, cai abaixo de R$ 25 e fecha o buraco.",
    concept:
      "O gap de exaustão é o último salto de uma tendência longa: o último comprador entrou correndo, e depois dele não sobrou ninguém.",
    rule:
      "Ele aparece no fim de um movimento, quase sempre com volume enorme, e é fechado rápido. O fechamento do buraco é o sinal de que a tendência acabou.",
    moral: "Quando até quem nunca comprou banana está comprando, a alta está no fim.",
  },
  "ilha-de-reversao": {
    scene:
      "Depois de uma longa alta, a banana dá um salto para cima (gap de exaustão) e fica uns dias negociando lá em cima. Aí, de repente, a feira abre com um salto para baixo, e aqueles dias lá no alto ficam isolados.",
    concept:
      "Os candles lá em cima, sem ponte nem de um lado nem do outro, formam uma ilha. É um sinal forte de virada: quem comprou na ilha ficou preso lá.",
    rule:
      "A ilha precisa de dois gaps em sentidos opostos, mais ou menos no mesmo preço. Vale também de cabeça para baixo, no fundo de uma queda.",
    moral: "Quem comprou banana na ilha ficou ilhado, e vai vender assim que achar um barco.",
  },
  volume: {
    scene:
      "Dois dias em que a banana sobe R$ 1. No primeiro, a feira está lotada e mil cachos trocam de mão. No segundo, quase ninguém aparece e só cem cachos são vendidos.",
    concept:
      "Volume é quantos cachos trocaram de mão no dia. Ele mede a convicção por trás do movimento: o mesmo R$ 1 de alta vale muito mais com a feira lotada.",
    rule:
      "Numa alta saudável, a fila cresce nos dias de subida e diminui nas recuadas. Rompimento sem fila é suspeito. O volume costuma mudar antes do preço, então ele avisa primeiro.",
    moral: "Preço diz para onde a banana foi; volume diz quanta gente acreditou.",
  },
  obv: {
    scene:
      "Você abre uma caderneta. No dia em que a banana fecha mais cara que na véspera, soma todos os cachos negociados. No dia em que fecha mais barata, subtrai.",
    concept:
      "Esse total acumulado é o OBV (On Balance Volume): mostra numa única linha se os cachos estão entrando ou saindo das mãos dos compradores.",
    rule:
      "O número em si não importa, e sim a direção. Caderneta subindo junto com o preço confirma a alta. Se a caderneta passa do recorde antes do preço, a banana pode estar prestes a ir atrás.",
    moral: "Uma caderneta simples conta quem está ganhando a briga pela banana.",
  },
  "divergencia-de-volume": {
    scene:
      "A banana bate um novo recorde: R$ 21, acima dos R$ 20 do mês passado. Mas a caderneta do OBV não passa do recorde anterior. Cada vez menos gente está comprando nesses preços.",
    concept:
      "Isso é a divergência: o preço faz um topo mais alto, mas o volume, medido pelo OBV, faz um topo mais baixo. O recorde está sendo feito com a feira esvaziando.",
    rule:
      "É um alerta, não uma ordem de venda: espere o preço confirmar, rompendo a linha de tendência ou um suporte. O mesmo vale ao contrário, num fundo mais baixo com a caderneta subindo.",
    moral: "Recorde com a feira esvaziando é festa com os convidados indo embora.",
  },
  "interesse-aberto": {
    scene:
      "Nesta feira ninguém leva banana na hora: negociam-se promessas. Uma promessa diz \"entrego 1 cacho no dia 30 por R$ 10\", e tem sempre dois lados: o comprado, que vai receber, e o vendido, que vai entregar.",
    concept:
      "Interesse aberto é quantas promessas ainda estão valendo. Se duas pessoas novas fazem uma promessa, ele sobe 1. Se alguém só repassa a sua promessa para outro, não muda (isso é volume). Se os dois lados desfazem a promessa, cai 1.",
    rule:
      "Banana subindo e promessas aumentando: alta com gente nova, forte. Banana subindo e promessas diminuindo: são os vendidos fugindo, alta fraca. Banana caindo e promessas aumentando: queda forte. Banana caindo e promessas diminuindo: comprados desistindo, a queda tende a acabar.",
    moral: "Volume conta quantas promessas mudaram de mão; interesse aberto conta quantas continuam vivas.",
  },
};
