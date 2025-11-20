const FLAG = "sesion_expirada";
const ENV_OVERRIDE_KEY = "DONACIONES_ENV";

export function esTokenExpirado(payload = {}) {
  const mensaje = (payload.message || payload.error || "").toLowerCase();
  return (
    mensaje.includes("jwt expired") ||
    mensaje.includes("token expired") ||
    mensaje.includes("token expirado") ||
    mensaje.includes("expirado")
  );
}

export function manejarExpiracionSesion() {
  if (sessionStorage.getItem(FLAG)) return;
  sessionStorage.setItem(FLAG, "1");

  mostrarToastSesion("Tu sesión expiró. Por favor, vuelve a iniciar sesión.");
  const envOverride = localStorage.getItem(ENV_OVERRIDE_KEY);
  localStorage.clear();
  if (envOverride) localStorage.setItem(ENV_OVERRIDE_KEY, envOverride);
  sessionStorage.clear();

  const path = window.location.pathname.includes("/src/")
    ? "../auth/login.html"
    : "./src/auth/login.html";

  setTimeout(() => {
    window.location.href = path;
  }, 1600);
}

export function instalarInterceptorFetch() {
  if (window.__fetchInterceptorInstalled) return;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    if (response?.status === 401) {
      try {
        const clone = response.clone();
        const data = await clone.json().catch(() => ({}));
        if (esTokenExpirado(data)) {
          manejarExpiracionSesion();
        }
      } catch (error) {
        console.error("Error evaluando expiración de sesión:", error);
      }
    }

    return response;
  };

  window.__fetchInterceptorInstalled = true;
}

function mostrarToastSesion(mensaje) {
  asegurarEstilosToast();
  const existing = document.getElementById("sesion-toast");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "sesion-toast";
  overlay.className = "sesion-toast-overlay";
  overlay.innerHTML = `
    <div class="sesion-toast-card">
      <div class="sesion-toast-title">Sesión expirada</div>
      <p>${mensaje}</p>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("visible"));

  setTimeout(() => {
    overlay.classList.remove("visible");
    overlay.classList.add("closing");
    setTimeout(() => overlay.remove(), 400);
  }, 1400);
}

function asegurarEstilosToast() {
  if (document.getElementById("sesion-toast-style")) return;

  const style = document.createElement("style");
  style.id = "sesion-toast-style";
  style.textContent = `
    .sesion-toast-overlay {
      position: fixed;
      top: 20px;
      right: 20px;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      z-index: 5000;
    }
    .sesion-toast-overlay.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .sesion-toast-card {
      background: #1d4ed8;
      color: #fff;
      padding: 1rem 1.3rem;
      border-radius: 12px;
      min-width: 240px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
      font-family: "Inter", "Segoe UI", sans-serif;
    }
    .sesion-toast-title {
      font-weight: 600;
      margin-bottom: 0.35rem;
      font-size: 1rem;
    }
    .sesion-toast-card p {
      margin: 0;
      font-size: 0.9rem;
    }
  `;

  document.head.appendChild(style);
}
