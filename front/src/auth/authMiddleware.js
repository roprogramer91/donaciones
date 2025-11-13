// src/utils/authMiddleware.js

// ✅ Verifica si el usuario tiene sesión activa
export function requireAuth(allowedRoles = []) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Si no hay token, redirigir al login
  if (!token) {
    window.location.href = "../auth/login.html";
    return;
  }

  // Si hay roles permitidos y el rol del usuario no está incluido
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    alert("No tienes permisos para acceder a esta sección.");
    window.location.href = "../auth/login.html";
    return;
  }
}
