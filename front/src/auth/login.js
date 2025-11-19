import { apiFetch } from "../utils/api.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

const REDIRECT_BY_ROLE = {
  donante: "../donante/dashboard-donante.html",
  centro: "../instituciones/dashboard-centro.html",
  admin: "../admin-panel.html",
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const identifier = document.getElementById("dni").value.trim();
  const password = document.getElementById("password").value.trim();
  message.textContent = "";

  try {
    const credentials = { password };
    if (identifier.includes("@")) {
      credentials.email = identifier;
    } else {
      credentials.dni = identifier;
    }

    const res = await apiFetch("/api/auth/login", "POST", credentials);
    console.log("Respuesta backend:", res);

    if (res.token) {
      const role = res.tipo_usuario;
      if (!role) {
        throw new Error("Tipo de usuario no recibido del servidor.");
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("tipo_usuario", role);
      localStorage.removeItem("login_context");

      const destino = REDIRECT_BY_ROLE[role] || "../../index.html";
      window.location.href = destino;
      return;
    }

    message.style.color = "red";
    message.textContent = res.message || "Error en el inicio de sesión.";
  } catch (error) {
    console.error("Error al conectar con el servidor:", error);
    message.style.color = "red";
    message.textContent =
      error?.message || "Error al conectar con el servidor.";
  }
});
