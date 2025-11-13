import { apiFetch } from "../utils/api.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dni = document.getElementById("dni").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await apiFetch("/auth/login", "POST", { dni, password });

    if (res.message.includes("Código 2FA enviado")) {
      sessionStorage.setItem("dni", dni); // Guardamos DNI para el paso siguiente
      message.textContent = "Código 2FA enviado a tu correo. Redirigiendo...";
      setTimeout(() => (window.location.href = "./verify.html"), 1500);
    } else {
      message.textContent = res.message || "Error en el inicio de sesión.";
    }
  } catch (error) {
    console.error(error);
    message.textContent = "Error al conectar con el servidor.";
  }
});
