// src/instituciones/login-centro.js
import { AUTH_URL } from "../config.js";

const form = document.getElementById("loginCentroForm");
const errorDiv = document.getElementById("login-error");
const btnAtras = document.getElementById("btn-atras");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // Evita el reload automático del formulario
  errorDiv.textContent = ""; // Limpia mensajes previos

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    errorDiv.textContent = "Por favor, completá ambos campos.";
    return;
  }

  try {
    const res = await fetch(`${AUTH_URL}/login-centro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorDiv.textContent = data.error || "Credenciales inválidas.";
      return;
    }

    // Guardar token y datos en localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("centroNombre", data.centro.nombre);

    // Redirigir al dashboard del centro
    window.location.href = "./dashboard-centro.html";
  } catch (error) {
    appLogger.error("Error en login-centro:", error);
    errorDiv.textContent = "Error de conexión con el servidor.";
  }
});

// Botón ← Volver al inicio
btnAtras.addEventListener("click", () => {
  window.location.href = "../../index.html";
});
import { appLogger } from "../utils/logger.js";
