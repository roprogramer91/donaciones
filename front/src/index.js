import { API_BASE_URL } from "./utils/config.js";

// ====== REDIRECCIÓN AUTOMÁTICA SI HAY TOKEN ======
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

    // El token es válido → necesitamos conocer el rol, que está guardado en localStorage
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
        // si por algún motivo no existe tipo_usuario, nos quedamos en index
        break;
    }
  } catch (err) {
    console.error("Error validando token:", err);
    localStorage.removeItem("token");
  }
})();



// ====== SUBMENÚ INGRESAR ======
const btnIngresar = document.getElementById("btnIngresar");
const submenu = document.getElementById("submenuIngresar");

// Alterna el submenú al hacer click en "Ingresar"
btnIngresar.addEventListener("click", () => {
  submenu.classList.toggle("oculto");
});

// ====== CONTEXTO DEL LOGIN ======
document.getElementById("ingresarDonante").addEventListener("click", () => {
  localStorage.setItem("login_context", "donante");
  window.location.href = "src/auth/login.html";
});

document.getElementById("ingresarCentro").addEventListener("click", () => {
  localStorage.setItem("login_context", "centro");
  window.location.href = "src/auth/login.html";
});

document.getElementById("ingresarAdmin").addEventListener("click", () => {
  localStorage.setItem("login_context", "admin");
  window.location.href = "src/auth/login.html";
});


// ====== BOTÓN REGISTRARME ======
document.getElementById("btnRegistrarme").addEventListener("click", () => {
  window.location.href = "src/auth/donante/test-donante.html";
});
