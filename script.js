
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

const selectorUF = document.getElementById("selectorUF");
const estadoCarga = document.getElementById("estadoCarga");
const btnEmpezar = document.getElementById("btnEmpezar");
const btnSiguiente = document.getElementById("btnSiguiente");
const btnTerminar = document.getElementById("btnTerminar");
const btnNuevo = document.getElementById("btnNuevo");
const btnRepetirFalladas = document.getElementById("btnRepetirFalladas");

const contador = document.getElementById("contador");
const ufActual = document.getElementById("ufActual");
const pregunta = document.getElementById("pregunta");
const opciones = document.getElementById("opciones");
const feedback = document.getElementById("feedback");
const resumen = document.getElementById("resumen");
const falladasDiv = document.getElementById("falladas");

iniciar();

async function iniciar() {
  crearSelectorUF();
  await cargarPreguntas();
}

function crearSelectorUF() {
  archivosUF.forEach((archivo, index) => {
    const uf = `UF${index + 1}`;

    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${uf}" checked> ${uf}`;

    selectorUF.appendChild(label);
  });
}

async function cargarPreguntas() {
  try {
    const respuestas = await Promise.all(
      archivosUF.map(archivo =>
        fetch(archivo).then(res => {
          if (!res.ok) {
            throw new Error(`No se pudo cargar ${archivo}`);
          }
          return res.json();
        })
      )
    );

    bancoPreguntas = respuestas.flat();

    estadoCarga.textContent = `Cargadas ${bancoPreguntas.length} preguntas.`;
    btnEmpezar.disabled = false;

  } catch (error) {
    estadoCarga.textContent =
      "Error cargando preguntas. Abre esto desde Live Server o servidor local.";
    btnEmpezar.disabled = true;
    console.error(error);
  }
}

btnEmpezar.addEventListener("click", empezarTest);
btnSiguiente.addEventListener("click", siguientePregunta);
btnTerminar.addEventListener("click", terminarTest);
btnNuevo.addEventListener("click", () => mostrarPantalla("inicio"));
btnRepetirFalladas.addEventListener("click", repetirFalladas);

function empezarTest() {
  const ufsSeleccionadas = Array.from(
    selectorUF.querySelectorAll("input:checked")
  ).map(input => input.value);

  const numPreguntas = parseInt(
    document.getElementById("numPreguntas").value,
    10
  );

  const filtradas = bancoPreguntas.filter(p =>
    ufsSeleccionadas.includes(p.uf)
  );

  if (filtradas.length === 0) {
    alert("Selecciona al menos una UF.");
    return;
  }

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
    alert("No hay preguntas falladas para repetir.");
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
  btnSiguiente.classList.add("oculto");

  const p = preguntasTest[preguntaActual];
  const opcionesMezcladas = mezclarOpciones(p);

  contador.textContent = `Pregunta ${preguntaActual + 1} de ${preguntasTest.length}`;
  ufActual.textContent = p.uf;
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

  botones.forEach(btn => {
    btn.disabled = true;
    setTimeout(() => {
  siguientePregunta();
}, 200);
  });

  if (esCorrecta) {
    aciertos++;
    boton.classList.add("correcta");
    feedback.textContent = "Correcta.";
  } else {
    fallos++;
    falladas.push(preguntaOriginal);
    boton.classList.add("incorrecta");

    feedback.textContent = `Incorrecta. ${preguntaOriginal.explicacion}`;

    botones.forEach(btn => {
      const textoBoton = btn.textContent.replace(/^.\)\s/, "");
      const respuestaCorrecta =
        preguntaOriginal.opciones[preguntaOriginal.correcta];

      if (textoBoton === respuestaCorrecta) {
        btn.classList.add("correcta");
      }
    });
  }

  btnSiguiente.classList.remove("oculto");
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

  const penalizacion = document.getElementById("penalizacion").value;
  const valorFallo =
    penalizacion === "tercio" ? valorAcierto / 3 : 0;

  let nota = aciertos * valorAcierto - fallos * valorFallo;

  if (nota < 0) {
    nota = 0;
  }

  resumen.innerHTML = `
    <div><strong>Aciertos:</strong> ${aciertos}</div>
    <div><strong>Fallos:</strong> ${fallos}</div>
    <div><strong>En blanco:</strong> ${blancas}</div>
    <div><strong>Nota sobre 4:</strong> ${nota.toFixed(2)}</div>
    <div><strong>Fórmula:</strong> aciertos × ${valorAcierto.toFixed(3)} - fallos × ${valorFallo.toFixed(3)}</div>
  `;

  pintarFalladas();
  mostrarPantalla("resultado");
}

function pintarFalladas() {
  falladasDiv.innerHTML = "";

  if (falladas.length === 0) {
    falladasDiv.innerHTML = "<p>No has fallado ninguna.</p>";
    return;
  }

  falladas.forEach(p => {
    const div = document.createElement("div");

    div.className = "fallada";

    div.innerHTML = `
      <strong>${p.uf} - ${p.pregunta}</strong>
      <div>Respuesta correcta: ${p.opciones[p.correcta]}</div>
      <div>${p.explicacion}</div>
    `;

    falladasDiv.appendChild(div);
  });
}

function mezclarOpciones(pregunta) {
  return mezclar(
    pregunta.opciones.map((texto, index) => ({
      texto: texto,
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

  if (nombre === "inicio") {
    pantallaInicio.classList.remove("oculto");
  }

  if (nombre === "quiz") {
    pantallaQuiz.classList.remove("oculto");
  }

  if (nombre === "resultado") {
    pantallaResultado.classList.remove("oculto");
  }
}