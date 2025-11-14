import { API_BASE_URL } from "../utils/config.js";

const form = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensaje.innerHTML = "";

  const usuario = form.usuario.value.trim();
  const password = form.password.value;

  if (!usuario || !password) {
    mensaje.style.color = "red";
    mensaje.textContent = "Completá todos los campos.";
    return;
  }

  // Detectar si es email o DNI
  let payload = { password };

  if (usuario.includes("@")) {
    payload.email = usuario;
  } else {
    payload.dni = usuario.replace(/\D/g, "");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      mensaje.style.color = "red";
      mensaje.textContent = data.message || "Error al iniciar sesión.";
      return;
    }

    // Guardar datos temporales para verify.html
    localStorage.setItem("temp_token", data.temp_token);
    localStorage.setItem("usuario_id", data.usuario_id);

    mensaje.style.color = "green";
    mensaje.textContent = "Código enviado. Redirigiendo...";

    setTimeout(() => {
      window.location.href = "../auth/verify.html";
    }, 1000);

  } catch (error) {
    mensaje.style.color = "red";
    mensaje.textContent = "No se pudo conectar con el servidor.";
  }
});
