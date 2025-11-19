import { API_BASE_URL } from "./utils/config.js";

// ====== REDIRECCION AUTOMATICA SI HAY TOKEN ======
(async function verificarSesion() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      localStorage.removeItem("token");
      return;
    }

    // El token es válido; se usa el rol guardado en localStorage.
    const tipo = localStorage.getItem("tipo_usuario");

    switch (tipo) {
      case "donante":
        window.location.href = "dashboard-donante.html";
        break;
      case "centro":
        window.location.href = "dashboard-centro.html";
        break;
      case "admin":
        window.location.href = "admin-panel.html";
        break;
      default:
        // sin tipo guardado, nos quedamos en la portada
        break;
    }
  } catch (err) {
    console.error("Error validando token:", err);
    localStorage.removeItem("token");
  }
})();

// ====== BOTONES PRINCIPALES ======
document.getElementById("btnIngresar").addEventListener("click", () => {
  window.location.href = "src/auth/login.html";
});

document.getElementById("btnRegistrarme").addEventListener("click", () => {
  window.location.href = "src/donante/test-donante.html";
});
