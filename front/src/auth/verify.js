import { apiFetch } from "../utils/api.js";

const form = document.getElementById("verifyForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dni = sessionStorage.getItem("dni");
  const code = document.getElementById("code").value.trim();

  try {
    const res = await apiFetch("/auth/verify", "POST", { dni, code });

    if (res.token && res.role) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      message.textContent = "Verificación exitosa. Redirigiendo...";

      setTimeout(() => {
        if (res.role === "admin") window.location.href = "../user/dashboard-admin.html";
        else if (res.role === "centro") window.location.href = "../instituciones/dashboard-centro.html";
        else window.location.href = "../donante/dashboard-donante.html";
      }, 1500);
    } else {
      message.textContent = res.message || "Código inválido o expirado.";
    }
  } catch (error) {
    console.error(error);
    message.textContent = "Error al conectar con el servidor.";
  }
});
