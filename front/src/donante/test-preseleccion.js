// test-preseleccion.js
const slides = document.querySelectorAll(".slide");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const form = document.getElementById("preTestForm");
const finalMessage = document.getElementById("finalMessage");
let current = 0;

function logoutAndGoHome() {
  localStorage.removeItem("token");
  window.location.href = "../../index.html";
}

// Lógica de testeo: si alguna respuesta no habilita donar, cortamos.
const rules = [
  { name: "edad", positive: "si" },
  { name: "peso", positive: "si" },
  { name: "salud", positive: "si" },
  { name: "enfermedad", positive: "no" },
  { name: "parejas", positive: "no" },
  { name: "drogas", positive: "no" },
  { name: "tatuajes", positive: "no" },
];

function showSlide(idx) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === idx);
  });
  prevBtn.style.display = idx === 0 ? "none" : "inline-block";
  nextBtn.style.display = idx === slides.length - 1 ? "none" : "inline-block";
}

function validateCurrentSlide() {
  // Chequea que la pregunta esté respondida
  const currentInputs = slides[current].querySelectorAll('input[type="radio"]');
  if (currentInputs.length) {
    return Array.from(currentInputs).some((input) => input.checked);
  }
  return true;
}

prevBtn.addEventListener("click", () => {
  if (current > 0) {
    current--;
    showSlide(current);
  }
});

nextBtn.addEventListener("click", () => {
  if (!validateCurrentSlide()) {
    alert("Tenés que responder para continuar.");
    return;
  }
  if (current < slides.length - 2) {
    current++;
    showSlide(current);
  } else if (current === slides.length - 2) {
    // Validar respuestas
    const data = Object.fromEntries(new FormData(form).entries());
    let apto = true;
    for (let rule of rules) {
      if (data[rule.name] !== rule.positive) {
        apto = false;
        break;
      }
    }
    current++;
    showSlide(current);
    if (apto) {
      finalMessage.innerHTML = `
        <h2>¡Podés ser donante!</h2>
        <button type="button" id="btnCompletarRegistro">Completar Registro</button>
      `;
      // Asignar el evento después de crear el botón
      document
        .getElementById("btnCompletarRegistro")
        .addEventListener("click", () => {
          // Lo redirijo a la página de registro para que cree su cuenta primero
          window.location.href = "registro.html";
        });
    } else {
      finalMessage.innerHTML = `
        <h2>No reunís los requisitos para donar sangre</h2>
        <p>Gracias por tu interés. Podés volver a intentarlo cuando cumplas con los requisitos.</p>
        <button type="button" id="btnHome">Volver al inicio</button>
      `;
      // Asignar el evento después de crear el botón
      document
        .getElementById("btnHome")
        .addEventListener("click", logoutAndGoHome);
    }
  }
});

showSlide(current); // Inicial

form.addEventListener("submit", (e) => e.preventDefault()); // Evitar submit por default
