const archivosUF = ["preguntas.json"];

let bancoPreguntas = [];
let preguntasTest = [];
let preguntaActual = 0;
let aciertos = 0;
let fallos = 0;
let blancas = 0;
let falladas = [];
let respondida = false;

const pantallaInicio = document.getElementById("pantallaInicio");
const pantallaQuiz = document.getElementById("pantallaQuiz");
const pantallaResultado = document.getElementById("pantallaResultado");

const estadoCarga = document.getElementById("estadoCarga");
const btnEmpezar = document.getElementById("btnEmpezar");
const btnNuevo = document.getElementById("btnNuevo");
const btnRepetirFalladas = document.getElementById("btnRepetirFalladas");

const contador = document.getElementById("contador");
const pregunta = document.getElementById("pregunta");
const opciones = document.getElementById("opciones");
const feedback = document.getElementById("feedback");
const resumen = document.getElementById("resumen");
const falladasDiv = document.getElementById("falladas");

iniciar();

async function iniciar() {
  await cargarPreguntas();
}

async function cargarPreguntas() {
  try {
    const res = await fetch("preguntas.json");
    bancoPreguntas = await res.json();

    estadoCarga.textContent = `Cargadas ${bancoPreguntas.length} preguntas.`;
    btnEmpezar.disabled = false;
  } catch (error) {
    estadoCarga.textContent = "Error cargando preguntas";
    console.error(error);
  }
}

btnEmpezar.addEventListener("click", empezarTest);
btnNuevo.addEventListener("click", () => mostrarPantalla("inicio"));
btnRepetirFalladas.addEventListener("click", repetirFalladas);

function empezarTest() {
  const numPreguntas = parseInt(
    document.getElementById("numPreguntas").value,
    10
  );

  const filtradas = bancoPreguntas;

  preguntasTest = mezclar(filtradas).slice(
    0,
    Math.min(numPreguntas, filtradas.length)
  );

  reiniciarEstado();
  mostrarPantalla("quiz");
  pintarPregunta();
}

function repetirFalladas() {
  if (falladas.length === 0) {
    alert("No hay falladas");
    return;
  }

  preguntasTest = mezclar(falladas);

  reiniciarEstado(false);
  mostrarPantalla("quiz");
  pintarPregunta();
}

function reiniciarEstado(limpiarFalladas = true) {
  preguntaActual = 0;
  aciertos = 0;
  fallos = 0;
  blancas = 0;
  respondida = false;

  if (limpiarFalladas) {
    falladas = [];
  }
}

function pintarPregunta() {
  respondida = false;
  feedback.textContent = "";

  const p = preguntasTest[preguntaActual];
  const opcionesMezcladas = mezclarOpciones(p);

  contador.textContent = `Pregunta ${preguntaActual + 1} de ${preguntasTest.length}`;
  pregunta.textContent = p.pregunta;
  opciones.innerHTML = "";

  opcionesMezcladas.forEach((opcion, index) => {
    const btn = document.createElement("button");

    btn.className = "respuesta";
    btn.textContent = `${String.fromCharCode(97 + index)}) ${opcion.texto}`;

    btn.addEventListener("click", () =>
      responder(btn, opcion.correcta, p)
    );

    opciones.appendChild(btn);
  });
}

function responder(boton, esCorrecta, preguntaOriginal) {
  if (respondida) return;

  respondida = true;

  const botones = opciones.querySelectorAll(".respuesta");
  botones.forEach(btn => (btn.disabled = true));

  if (esCorrecta) {
    aciertos++;
    boton.classList.add("correcta");
    feedback.textContent = "Correcta";
  } else {
    fallos++;
    falladas.push(preguntaOriginal);
    boton.classList.add("incorrecta");

    feedback.textContent = `Incorrecta. ${preguntaOriginal.explicacion}`;

    botones.forEach(btn => {
      const texto = btn.textContent.replace(/^.\)\s/, "");
      const correcta =
        preguntaOriginal.opciones[preguntaOriginal.correcta];

      if (texto === correcta) {
        btn.classList.add("correcta");
      }
    });
  }

  setTimeout(() => {
    siguientePregunta();
  }, 600);
}

function siguientePregunta() {
  preguntaActual++;

  if (preguntaActual >= preguntasTest.length) {
    terminarTest();
  } else {
    pintarPregunta();
  }
}

function terminarTest() {
  const total = preguntasTest.length;
  blancas = total - aciertos - fallos;

  const valorAcierto = 4 / total;
  const valorFallo = valorAcierto / 3;

  let nota = aciertos * valorAcierto - fallos * valorFallo;
  if (nota < 0) nota = 0;

  resumen.innerHTML = `
    <div><strong>Aciertos:</strong> ${aciertos}</div>
    <div><strong>Fallos:</strong> ${fallos}</div>
    <div><strong>En blanco:</strong> ${blancas}</div>
    <div><strong>Nota sobre 4:</strong> ${nota.toFixed(2)}</div>
  `;

  pintarFalladas();
  mostrarPantalla("resultado");
}

function pintarFalladas() {
  falladasDiv.innerHTML = "";

  if (falladas.length === 0) {
    falladasDiv.innerHTML = "<p>Todo correcto</p>";
    return;
  }

  falladas.forEach(p => {
    const div = document.createElement("div");

    div.className = "fallada";

    div.innerHTML = `
      <strong>${p.pregunta}</strong>
      <div>Correcta: ${p.opciones[p.correcta]}</div>
      <div>${p.explicacion}</div>
    `;

    falladasDiv.appendChild(div);
  });
}

function mezclarOpciones(pregunta) {
  return mezclar(
    pregunta.opciones.map((texto, index) => ({
      texto,
      correcta: index === pregunta.correcta
    }))
  );
}

function mezclar(array) {
  const copia = [...array];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function mostrarPantalla(nombre) {
  pantallaInicio.classList.add("oculto");
  pantallaQuiz.classList.add("oculto");
  pantallaResultado.classList.add("oculto");

  if (nombre === "inicio") pantallaInicio.classList.remove("oculto");
  if (nombre === "quiz") pantallaQuiz.classList.remove("oculto");
  if (nombre === "resultado") pantallaResultado.classList.remove("oculto");
}