import { API_BASE_URL } from "../utils/config.js";

const form = document.getElementById("verifyForm");
const message = document.getElementById("message");

document.addEventListener("DOMContentLoaded", () => {
  // Si no hay usuario_id, no debería estar acá. Lo mando al login.
  const usuario_id = sessionStorage.getItem("usuario_id");
  if (!usuario_id) {
    window.location.href = "./login.html";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";

  const codigo = document.getElementById("codigo").value.trim();
  const trustDevice = document.getElementById("trustDevice").checked;
  const usuario_id = sessionStorage.getItem("usuario_id");

  if (!codigo || !usuario_id) {
    message.style.color = "red";
    message.textContent = "Faltan datos para la verificación.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: parseInt(usuario_id, 10),
        codigo,
        trust_device: trustDevice,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Código incorrecto o expirado.");
    }

    // Si la verificación es exitosa, guardo el token final y redirijo
    localStorage.setItem("token", data.token);
    sessionStorage.clear(); // Limpio los datos temporales de sesión
    window.location.href = "../donante/dashboard-donante.html";
  } catch (error) {
    message.style.color = "red";
    message.textContent = error.message;
  }
});
