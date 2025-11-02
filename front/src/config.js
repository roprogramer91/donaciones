// front/src/config.js




// cambiar variable segun el entorno
const ENV = window.location.hostname.includes("localhost")
  ? "development"
  : "production";

// URLs por entorno
const CONFIG = {
  development: {
    API_BASE_URL: "https://donaciones-back-dev-entorno.up.railway.app",
    AUTH_URL: "http://localhost:5000",
  },
  production: {
    API_BASE_URL: "https://donaciones-production.up.railway.app",
    AUTH_URL: "https://donaciones-auth-service-production.up.railway.app",
  },
};

// Exportar las URLs dependiendo del entorno detectado
export const API_BASE_URL = CONFIG[ENV].API_BASE_URL;
export const AUTH_URL = CONFIG[ENV].AUTH_URL;
