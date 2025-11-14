import { apiFetch } from "../utils/api.js";

const form = document.getElementById("verifyForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = document.getElementById("codigo").value.trim();
  const usuario_id = sessionStorage.getItem("usuario_id"); 

  // Validar campos
  if (!usuario_id || !codigo) {
    message.style.color = "red";
    message.textContent = "Datos incompletos.";
    return;
  }

  try {
    const res = await apiFetch("/auth/verify", "POST", { usuario_id, codigo });

    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      localStorage.setItem("dni", sessionStorage.getItem("dni"));

      message.style.color = "green";
      message.textContent = "Verificación exitosa. Redirigiendo...";

      setTimeout(() => {
        if (res.role === "admin") window.location.href = "../admin/dashboard-admin.html";
        else if (res.role === "centro") window.location.href = "../instituciones/dashboard-centro.html";
        else window.location.href = "../donante/dashboard-donante.html";
      }, 1500);
    } else {
      message.style.color = "red";
      message.textContent = res.message || "Código incorrecto o expirado.";
    }
  } catch (error) {
    console.error("❌ Error:", error);
    message.style.color = "red";
    message.textContent = "Error al conectar con el servidor.";
  }
});
