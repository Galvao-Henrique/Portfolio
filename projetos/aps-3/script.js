let idRegiao = 0;
let nome_regiao = "";

function showAside(estadoId) {
  idRegiao = estadoId;
  const aside = document.getElementsByTagName("aside")[0];
  aside.classList.remove("hidden");
}

function showBtniniciarQuiz() {
  const iniciarQuiz = document.getElementById("iniciarQuiz");
  iniciarQuiz.classList.remove("hidden");
}

async function buscarInfoRegiao(regiao) {
    const url = `https://api-regioes-meioambiente.onrender.com/info_regiao?regiao_nome=${regiao}`;
    try {
      let resp = await fetch(url)
      if (!resp.ok) {
        throw new Error(`Erro na requisição: ${resp.statusText}`);
      }
      let data = await resp.json()
      return data
    } catch (error) {
      console.error('Erro ao buscar informações da questão:', error);
      return
    }
}

async function questoes(regiao_nome) {
    const url = `https://api-regioes-meioambiente.onrender.com/${regiao_nome}/questao`;
    try {
      let response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.statusText}`);
      }
      const data = await response.json();
      return data; // Retorna o objeto com a resposta da API
    } catch (error) {
      console.error('Erro ao buscar informações da questão:', error);
      return { error: error.message }; 
    }
}

function getIdPerguntaAtual() {
    const questoes = document.querySelector('li.questao.selected').id;
    return questoes;
}

function montarPergunta(pergunta) {
  const id = pergunta.id;
  const enunciado = pergunta.pergunta;
  const alternativas = pergunta.alternativas;

  return `
        <li class="questao" id="questao-${id}">
            <p class="enunciado">${enunciado}</p>
            <ol id="questao" type="a">
                <li class="alternativa">
                    <input  type="radio" name="questao-${id}-alternativa" id="questao-${id}-alternativa-a" value="${alternativas.a}"/>
                    <label for="a">${alternativas.a}</label>
                </li>
                <li class="alternativa">
                    <input  type="radio" name="questao-${id}-alternativa" id="questao-${id}-alternativa-b" value="${alternativas.b}"/>
                    <label for="b">${alternativas.b}</label>
                </li>
                <li class="alternativa">
                    <input  type="radio" name="questao-${id}-alternativa" id="questao-${id}-alternativa-c" value="${alternativas.c}"/>
                    <label for="c">${alternativas.c}</label>
                </li>
                <li class="alternativa">
                    <input  type="radio" name="questao-${id}-alternativa" id="questao-${id}-alternativa-c" value="${alternativas.d}"/>
                    <label for="d">${alternativas.d}</label>
                </li>
            </ol>
         </li>
  `
}
function montarQuiz(quiz) {
  const questoes = quiz;

  let idQuestaoAtual = questoes[0].id;

  let perguntas = questoes.map(questao => montarPergunta(questao));
  document.getElementById("perguntas").innerHTML = perguntas.join('');
  idPerguntaAtual = "questao-" + idQuestaoAtual;
}

function mostrarPerguntaById(id) {
    let pergunta = document.getElementById(`${id}`);
    pergunta.classList.add("selected");
}

function esconderPerguntaById(id) {
    let pergunta = document.getElementById(`${id}`);
    pergunta.classList.remove("selected");
}

function mostrarElementoById(id) {
    const elemento = document.getElementById(id);
    elemento.classList.remove("hidden");
}

function esconderElementoById(id) {
    const elemento = document.getElementById(id);
    elemento.classList.add("hidden");
}

function desativarBotaoPorId(id) {
    const botao= document.getElementById(id);
    botao.disabled = true;
}

function ativarBotaoPorId(id) {
    const botao= document.getElementById(id);
    botao.disabled = false;
}

iniciarQuiz.addEventListener('click', async () => {
  let quizBuscado = await questoes(nome_regiao);
  let idQuestaoAtual = quizBuscado[0].id;

  montarQuiz(quizBuscado);

  esconderElementoById("iniciarQuiz");
  mostrarElementoById("quiz");

  document.querySelectorAll('li.alternativa input').forEach(radio => {
    radio.addEventListener('change',() => {
        ativarBotaoPorId('proxBtn');
    });
  });
  mostrarPerguntaById("questao-" + idQuestaoAtual);
});

function proxPergunta(event) {
    let perguntaAtual = document.getElementById(`${getIdPerguntaAtual()}`);
    let proxPergunta = perguntaAtual.nextElementSibling;

    if(proxPergunta) {
        if(!proxPergunta.nextElementSibling){
            esconderElementoById("proxBtn");
            ativarBotaoPorId('finalizar-quiz')
            mostrarElementoById("finalizar-quiz");
        }
        console.log(proxPergunta.nextElementSibling)
        mostrarPerguntaById(proxPergunta.id);
    } 

    esconderPerguntaById(perguntaAtual.id);
    desativarBotaoPorId('proxBtn');

    event.preventDefault()
}

proxBtn.addEventListener('click', proxPergunta);

// respostas deve ser uma string separada por ,
async function buscarResultados(respostas) {
    const url = `https://api-regioes-meioambiente.onrender.com/respostas_corretas?regiao_nome=${nome_regiao}&respostas=${respostas}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`response status: ${response.status}`)
        }
        const resultado = await response.json();

        return resultado;
    } catch(error) {
        console.error(error.message);
    }
}

async function enviarQuiz() {
    const respostas = []
    desativarBotaoPorId('finalizar-quiz');
    const inputsSelecionados = document.querySelectorAll("li.alternativa input[type='radio']:checked");
    inputsSelecionados.forEach(
        input => respostas.push(input.id.split("-")[3].toUpperCase())
    );
    const resultado = await buscarResultados(respostas); 

    const pontuacao = document.querySelector('#pontuacao p span');
    console.log(resultado)
    pontuacao.textContent = resultado.quant_acertos;
    esconderElementoById('quiz');
    mostrarElementoById('pontuacao')
}

document.getElementById("finalizar-quiz").addEventListener('click', () => {
    enviarQuiz();
    // setTimeout(window.location.reload.bind(window.location), 2000);
})
document.addEventListener("DOMContentLoaded", () => {
    const mapa = document.getElementById("mapa-brasil");
  
    // Acessa o conteúdo do SVG
    mapa.addEventListener("load", () => {
      const svgDoc = mapa.contentDocument;
      // Seleciona todos os estados pelo ID ou classe
      const estados = svgDoc.querySelectorAll('[id^="estado-BR"]');
      estados.forEach((estado) => {
        // Salva a cor original do estado
        const corOriginal = estado.style.fill;
        // Adiciona evento de clique
        estado.addEventListener("click", async () => {
            showAside(estado.classList[1].substring(6).toLowerCase());
            showBtniniciarQuiz();
            nome_regiao = estado.className.animVal.split(" ")[1].replace("Regiao", '').toLowerCase()
        });
          // Adiciona efeito de hover
          estado.addEventListener("mouseover", () => {
            t_regiao = estado.className.animVal.split(" ")[1]
            regioes = svgDoc.querySelectorAll(`.${t_regiao}`)
            for (let i = 0; i < regioes.length; i++){
                regioes[i].style.fill = "#1f3b60"
            }
        });
        // Retorna à cor original no mouseout
        estado.addEventListener("mouseout", () => {
            t_regiao = estado.className.animVal.split(" ")[1]
            regioes = svgDoc.querySelectorAll(`.${t_regiao}`)
            for (let i = 0; i < regioes.length; i++){
                regioes[i].style.fill = corOriginal
            }
        });
      });
    });
  });
