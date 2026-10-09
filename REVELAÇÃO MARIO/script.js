/* =====================================================================
   GUIA DE IMAGENS (LEIA PRIMEIRO!)
   ---------------------------------------------------------------------
   Coloque seus arquivos de imagem NA MESMA PASTA do index.html e dê
   exatamente estes nomes (tudo minúsculo):
     parado.png   -> Mario parado (idle)
     andando.png  -> Mario andando (passo 1)
     andando2.png -> Mario andando (passo 2, alterna com o passo 1)
     caixa.png    -> (opcional) a caixa amarela com "?"
     fundo.png    -> (opcional) imagem de fundo (ex.: as montanhas)
   Se algum arquivo não existir, o jogo desenha uma versão simples no
   lugar, então ele funciona mesmo sem imagens.
   A fonte das letras é o arquivo SuperMario256.ttf (também na mesma pasta).
   Para trocar os nomes, edite as linhas "NOME_..." logo abaixo.
   ===================================================================== */

// ---------- NOMES DOS ARQUIVOS DE IMAGEM (edite se quiser) ----------
const NOME_PARADO  = "parado.png";   // Nome do arquivo do Mario parado
const NOME_ANDANDO = "andando.png";  // Nome do arquivo do Mario andando
const NOME_ANDANDO2 = "andando2.png"; // Nome do arquivo do Mario andando (passo 2)
const NOME_CAIXA   = "caixa.png";    // Nome do arquivo da caixa amarela
const NOME_FUNDO   = "fundo.png";    // Nome do arquivo do fundo

// ---------- VARIÁVEIS FÁCEIS DE EDITAR ----------
const VELOCIDADE      = 2;     // Pixels que o Mario anda por quadro (maior = mais rápido)
const FORCA_PULO      = 13;    // Impulso inicial do pulo (maior = pula mais alto)
const GRAVIDADE       = 0.6;   // Quanto a gravidade puxa para baixo a cada quadro
const TROCA_PASSO     = 12;     // A cada quantos quadros troca entre andando e andando2 (menor = pernas mais rápidas)
const FONTE_LETRAS    = "SuperMario256"; // Nome da fonte das letras (definido no style.css)
const TAMANHO_LETRAS  = 56;    // Tamanho das letras em pixels
const PERSONAGEM_LARG = 46;    // Largura do Mario em pixels
const PERSONAGEM_ALT  = 64;    // Altura do Mario em pixels
const CAIXA_TAM       = 44;    // Tamanho (lado) de cada caixa em pixels
const ALTURA_CAIXAS   = 140;   // Distância das caixas até o chão (precisa ser alcançável pelo pulo)
const ESPACO_CAIXAS   = 60;    // Distância (borda a borda) entre uma caixa e outra
const LETRAS          = ["M", "E", "N", "I", "N", "O"]; // Uma letra por caixa (edite o texto aqui)
const CORES_LETRAS    = ["#ff5fc8", "#4fb3ff"];         // Cores que se alternam nas letras (rosa e azul)
const ALTURA_FLUTUAR  = 110;   // Altura acima da caixa onde a letra fica flutuando

// ---------- PREPARANDO O CANVAS ----------
const canvas = document.getElementById("jogo");  // Pega a tela de desenho pelo id do HTML
const ctx = canvas.getContext("2d");             // Pega o "pincel" 2D para desenhar nela
const CHAO_Y = canvas.height - 70;               // Posição Y (de cima para baixo) onde começa o chão

// ---------- CARREGANDO AS IMAGENS ----------
function carregarImagem(nome) {                  // Função que cria e carrega uma imagem
  const img = new Image();                       // Cria um objeto de imagem vazio
  img.pronta = false;                            // Marca que ainda não carregou
  img.onload = () => { img.pronta = true; };     // Quando carregar com sucesso, marca como pronta
  img.src = nome;                                // Diz qual arquivo carregar (inicia o carregamento)
  return img;                                    // Devolve a imagem
}
const imgParado  = carregarImagem(NOME_PARADO);  // Carrega a imagem do Mario parado
const imgAndando = carregarImagem(NOME_ANDANDO); // Carrega a imagem do Mario andando
const imgAndando2 = carregarImagem(NOME_ANDANDO2); // Carrega a imagem do Mario andando (passo 2)
const imgCaixa   = carregarImagem(NOME_CAIXA);   // Carrega a imagem da caixa
const imgFundo   = carregarImagem(NOME_FUNDO);   // Carrega a imagem de fundo

// ---------- CARREGANDO A FONTE ----------
document.fonts.load(TAMANHO_LETRAS + "px " + FONTE_LETRAS); // Pede ao navegador para carregar a fonte (as letras usam ela quando estiver pronta)

// ---------- TECLADO ----------
const teclas = { esquerda: false, direita: false, pulo: false }; // Guarda quais teclas estão apertadas agora

window.addEventListener("keydown", (e) => {      // Roda quando uma tecla é apertada
  if (e.code === "KeyA") teclas.esquerda = true; // Tecla A apertada -> esquerda ligada
  if (e.code === "KeyD") teclas.direita = true;  // Tecla D apertada -> direita ligada
  if (e.code === "KeyW") teclas.pulo = true;     // Tecla W apertada -> pulo ligado
});

window.addEventListener("keyup", (e) => {         // Roda quando uma tecla é solta
  if (e.code === "KeyA") teclas.esquerda = false; // Soltou A -> esquerda desligada
  if (e.code === "KeyD") teclas.direita = false;  // Soltou D -> direita desligada
  if (e.code === "KeyW") teclas.pulo = false;     // Soltou W -> pulo desligado
});

// ---------- O PERSONAGEM ----------
const mario = {                                   // Objeto com todos os dados do Mario
  x: 60,                                          // Posição horizontal inicial
  y: CHAO_Y - PERSONAGEM_ALT,                     // Posição vertical inicial (em cima do chão)
  larg: PERSONAGEM_LARG,                          // Largura da caixa de colisão
  alt: PERSONAGEM_ALT,                            // Altura da caixa de colisão
  vx: 0,                                          // Velocidade horizontal atual
  vy: 0,                                          // Velocidade vertical atual (positivo = descendo)
  noChao: false,                                  // Está apoiado em algo (chão ou caixa)?
  olhandoEsquerda: false,                         // Está virado para a esquerda?
  contadorPasso: 0,                               // Conta quadros para saber a hora de trocar de imagem
  passo: 0                                        // Qual imagem de andar usar: 0 = andando, 1 = andando2
};

// ---------- AS CAIXAS ----------
const caixas = [];                                // Lista (vazia) que vai guardar todas as caixas
const larguraTotal = LETRAS.length * CAIXA_TAM + (LETRAS.length - 1) * ESPACO_CAIXAS; // Largura do conjunto de caixas
const inicioX = (canvas.width - larguraTotal) / 2 + 40; // X da primeira caixa (conjunto centralizado)
for (let i = 0; i < LETRAS.length; i++) {         // Repete uma vez para cada letra
  caixas.push({                                   // Adiciona uma nova caixa na lista
    x: inicioX + i * (CAIXA_TAM + ESPACO_CAIXAS), // Posição X desta caixa
    y: CHAO_Y - ALTURA_CAIXAS,                    // Posição Y da caixa (no ar)
    larg: CAIXA_TAM,                              // Largura da caixa
    alt: CAIXA_TAM,                               // Altura da caixa
    letra: LETRAS[i],                             // Letra que esta caixa guarda
    cor: CORES_LETRAS[i % CORES_LETRAS.length],   // Cor da letra (alterna rosa/azul)
    atingida: false,                              // Ainda não foi batida
    saltoCaixa: 0                                 // Animação: quanto a caixa "pula" ao ser batida
  });
}

// ---------- AS LETRAS SOLTAS ----------
const letrasSoltas = [];                          // Lista das letras que já saíram das caixas

function soltarLetra(caixa) {                     // Cria uma letra saindo de uma caixa
  letrasSoltas.push({                             // Adiciona na lista de letras soltas
    texto: caixa.letra,                           // Qual letra é
    cor: caixa.cor,                               // Qual cor ela tem
    x: caixa.x + caixa.larg / 2,                  // X: centro da caixa
    y: caixa.y,                                   // Y: começa na altura da caixa
    vy: -9,                                       // Velocidade inicial para CIMA (negativo = sobe)
    destinoY: caixa.y - ALTURA_FLUTUAR,           // Altura onde ela vai ficar flutuando
    fase: Math.random() * 6.28                    // Ponto inicial aleatório do balanço (flutuar)
  });
}

// ---------- FUNÇÃO AUXILIAR: DETECTAR SOBREPOSIÇÃO ----------
function colide(a, b) {                           // Retorna true se os retângulos a e b se tocam
  return a.x < b.x + b.larg &&                    // Lado esquerdo de A está antes do lado direito de B
         a.x + a.larg > b.x &&                    // Lado direito de A passou do lado esquerdo de B
         a.y < b.y + b.alt &&                     // Topo de A está acima da base de B
         a.y + a.alt > b.y;                       // Base de A está abaixo do topo de B
}

// ---------- ATUALIZAÇÃO DA LÓGICA (roda ~60 vezes por segundo) ----------
function atualizar() {
  // --- Movimento horizontal ---
  mario.vx = 0;                                   // Começa parado a cada quadro
  if (teclas.esquerda) {                          // Se A está apertada...
    mario.vx = -VELOCIDADE;                       // ...velocidade negativa (vai para a esquerda)
    mario.olhandoEsquerda = true;                 // ...e vira o personagem para a esquerda
  }
  if (teclas.direita) {                           // Se D está apertada...
    mario.vx = VELOCIDADE;                        // ...velocidade positiva (vai para a direita)
    mario.olhandoEsquerda = false;                // ...e vira o personagem para a direita
  }

  // --- Animação do passo (alterna entre andando e andando2) ---
  if (mario.vx !== 0) {                           // Se o Mario está andando...
    mario.contadorPasso++;                        // ...conta mais um quadro
    if (mario.contadorPasso >= TROCA_PASSO) {     // ...se já passaram quadros suficientes...
      mario.contadorPasso = 0;                    // ...zera o contador
      mario.passo = (mario.passo === 0) ? 1 : 0;  // ...e troca de 0 para 1 (ou de 1 para 0)
    }
  } else {                                        // Se está parado...
    mario.contadorPasso = 0;                      // ...zera o contador
    mario.passo = 0;                              // ...e a próxima caminhada começa no passo 1
  }

  // --- Pulo ---
  if (teclas.pulo && mario.noChao) {              // Se W apertada E está apoiado em algo...
    mario.vy = -FORCA_PULO;                       // ...dá impulso para cima (negativo = sobe)
    mario.noChao = false;                         // ...agora está no ar
  }

  // --- Gravidade ---
  mario.vy += GRAVIDADE;                          // A cada quadro, aumenta a velocidade para baixo

  // --- Mover no eixo X e resolver colisões horizontais ---
  mario.x += mario.vx;                            // Aplica o movimento horizontal
  if (mario.x < 0) mario.x = 0;                   // Não deixa sair pela borda esquerda
  if (mario.x + mario.larg > canvas.width) mario.x = canvas.width - mario.larg; // Nem pela direita
  for (const c of caixas) {                       // Verifica cada caixa
    if (colide(mario, c)) {                       // Se encostou nesta caixa pelo lado...
      if (mario.vx > 0) mario.x = c.x - mario.larg; // ...indo para a direita: encosta na lateral esquerda da caixa
      else if (mario.vx < 0) mario.x = c.x + c.larg; // ...indo para a esquerda: encosta na lateral direita
    }
  }

  // --- Mover no eixo Y e resolver colisões verticais ---
  mario.y += mario.vy;                            // Aplica o movimento vertical
  mario.noChao = false;                           // Assume que está no ar até provar o contrário

  for (const c of caixas) {                       // Verifica cada caixa
    if (colide(mario, c)) {                       // Se está sobrepondo a caixa...
      if (mario.vy > 0) {                         // ...e estava CAINDO: pousou em cima da caixa
        mario.y = c.y - mario.alt;                // Coloca os pés exatamente no topo da caixa
        mario.vy = 0;                             // Para a queda
        mario.noChao = true;                      // Agora está apoiado (pode pular de novo)
      } else if (mario.vy < 0) {                  // ...e estava SUBINDO: bateu a cabeça embaixo
        mario.y = c.y + c.alt;                    // Cola a cabeça na parte de baixo da caixa
        mario.vy = 0;                             // Zera a velocidade: ele cai imediatamente
        if (!c.atingida) {                        // Se a caixa ainda não foi batida...
          c.atingida = true;                      // ...marca como atingida (só solta 1 letra)
          c.saltoCaixa = 10;                      // ...inicia a animação de "tremida" da caixa
          soltarLetra(c);                         // ...dispara o evento: a letra sai da caixa
        }
      }
    }
  }

  // --- Colisão com o chão ---
  if (mario.y + mario.alt >= CHAO_Y) {            // Se os pés passaram da linha do chão...
    mario.y = CHAO_Y - mario.alt;                 // ...recoloca os pés exatamente no chão
    mario.vy = 0;                                 // ...para a queda
    mario.noChao = true;                          // ...está apoiado
  }

  // --- Animação das caixas (tremidinha ao serem batidas) ---
  for (const c of caixas) {                       // Para cada caixa
    if (c.saltoCaixa > 0) c.saltoCaixa -= 1;      // Diminui a animação aos poucos até zerar
  }

  // --- Atualizar as letras soltas ---
  for (const l of letrasSoltas) {                 // Para cada letra solta
    l.fase += 0.05;                               // Avança o ângulo do balanço
    if (l.y > l.destinoY || l.vy < 0) {           // Enquanto ainda não chegou na altura final (ou está subindo)...
      l.vy += 0.5;                                // ...a gravidade desacelera a subida (efeito de "pulinho")
      l.y += l.vy;                                // ...e aplica o movimento vertical
      if (l.vy > 0 && l.y >= l.destinoY) {        // Se começou a descer e alcançou a altura de flutuar...
        l.y = l.destinoY;                         // ...trava nessa altura
        l.vy = 0;                                 // ...e para de se mover
      }
    }
  }
}

// ---------- DESENHO (roda ~60 vezes por segundo) ----------
function desenharFundo() {
  if (imgFundo.pronta) {                          // Se a imagem de fundo carregou...
    ctx.drawImage(imgFundo, 0, 0, canvas.width, canvas.height); // ...estica ela na tela toda
  } else {                                        // Senão, desenha um fundo simples
    ctx.fillStyle = "#7ec8e3";                    // Cor azul-céu
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Pinta a tela inteira
    ctx.fillStyle = "#bdb7a6";                    // Cor cinza-areia das "montanhas"
    ctx.fillRect(0, CHAO_Y - 160, canvas.width, 160); // Faixa de montanhas simples
  }
}

function desenharChao() {
  ctx.fillStyle = "#e0a82e";                      // Cor de terra
  ctx.fillRect(0, CHAO_Y, canvas.width, canvas.height - CHAO_Y); // Retângulo do chão
  ctx.fillStyle = "#2fa52f";                      // Cor da grama
  ctx.fillRect(0, CHAO_Y, canvas.width, 12);      // Faixa de grama no topo do chão
}

function desenharCaixa(c) {
  const y = c.y - c.saltoCaixa;                   // Sobe a caixa um pouco enquanto a animação roda
  if (c.atingida) {                               // Caixa já usada: desenha marrom vazia
    ctx.fillStyle = "#8a5a2b";                    // Marrom
    ctx.fillRect(c.x, y, c.larg, c.alt);          // Corpo da caixa
    ctx.strokeStyle = "#4a2f12";                  // Contorno marrom escuro
    ctx.lineWidth = 3;                            // Espessura do contorno
    ctx.strokeRect(c.x, y, c.larg, c.alt);        // Desenha o contorno
  } else if (imgCaixa.pronta) {                   // Caixa nova e a imagem existe: usa a imagem
    ctx.drawImage(imgCaixa, c.x, y, c.larg, c.alt); // Desenha o PNG da caixa
  } else {                                        // Caixa nova sem imagem: desenha amarela com "?"
    ctx.fillStyle = "#f5c518";                    // Amarelo
    ctx.fillRect(c.x, y, c.larg, c.alt);          // Corpo da caixa
    ctx.strokeStyle = "#7a5a00";                  // Contorno marrom
    ctx.lineWidth = 3;                            // Espessura
    ctx.strokeRect(c.x, y, c.larg, c.alt);        // Contorno
    ctx.fillStyle = "#fff";                       // Cor do "?"
    ctx.font = "bold 28px Arial";                 // Fonte do "?"
    ctx.textAlign = "center";                     // Centraliza o texto no X dado
    ctx.fillText("?", c.x + c.larg / 2, y + c.alt - 11); // Escreve o "?"
  }
}

function desenharLetra(l) {
  const balanco = Math.sin(l.fase) * 4;           // Calcula uma oscilação suave (±4 pixels) para flutuar
  ctx.font = TAMANHO_LETRAS + "px " + FONTE_LETRAS + ", Arial Black, Arial"; // Fonte do Mario (com reserva caso não carregue)
  ctx.textAlign = "center";                       // Centraliza no X
  ctx.lineWidth = 8;                              // Espessura da borda da letra
  ctx.strokeStyle = "#222";                       // Borda escura (efeito de sombra do estilo do jogo)
  ctx.strokeText(l.texto, l.x + 3, l.y + balanco + 3); // Desenha a borda levemente deslocada
  ctx.fillStyle = l.cor;                          // Cor de preenchimento da letra
  ctx.fillText(l.texto, l.x, l.y + balanco);      // Desenha a letra colorida
}

function desenharMario() {
  let img = imgParado;                            // Por padrão usa a imagem de parado
  if (mario.vx !== 0) {                           // Se está andando...
    img = (mario.passo === 0) ? imgAndando : imgAndando2; // ...alterna entre as duas imagens de andar
    if (!img.pronta) img = imgAndando;            // Se a andando2 não existir, usa só a andando
  }
  ctx.save();                                     // Guarda o estado do pincel (para desfazer o espelhamento depois)
  if (mario.olhandoEsquerda) {                    // Se está virado para a esquerda...
    ctx.translate(mario.x + mario.larg, mario.y); // ...move a origem para o canto direito do personagem
    ctx.scale(-1, 1);                             // ...inverte o eixo X (espelha a imagem)
  } else {                                        // Se está virado para a direita...
    ctx.translate(mario.x, mario.y);              // ...apenas move a origem para o canto do personagem
  }
  if (img.pronta) {                               // Se a imagem carregou...
    ctx.drawImage(img, 0, 0, mario.larg, mario.alt); // ...desenha o sprite no tamanho configurado
  } else {                                        // Senão desenha um boneco simples no lugar
    ctx.fillStyle = (mario.vx !== 0) ? "#e03030" : "#c01818"; // Vermelho (muda um pouco ao andar)
    ctx.fillRect(0, 0, mario.larg, mario.alt);    // Retângulo do corpo
    ctx.fillStyle = "#fff";                       // Cor do "olho"
    ctx.fillRect(mario.larg - 16, 12, 8, 8);      // Olho (mostra para onde ele olha)
  }
  ctx.restore();                                  // Desfaz translate/scale para não afetar outros desenhos
}

function desenhar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Apaga o quadro anterior
  desenharFundo();                                // 1) Fundo
  desenharChao();                                 // 2) Chão
  for (const c of caixas) desenharCaixa(c);       // 3) Todas as caixas
  for (const l of letrasSoltas) desenharLetra(l); // 4) Letras soltas
  desenharMario();                                // 5) Mario por cima de tudo
}

// ---------- LOOP PRINCIPAL ----------
function loop() {
  atualizar();                                    // Calcula a física e as colisões
  desenhar();                                     // Desenha tudo na tela
  requestAnimationFrame(loop);                    // Pede ao navegador para repetir no próximo quadro
}
loop();                                           // Inicia o jogo
