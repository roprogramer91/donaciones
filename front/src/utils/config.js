
// src/utils/config.js

// Detectar entorno (localhost o 127.0.0.1)
const hostname = window.location.hostname;

const ENV = (hostname.includes("localhost") || hostname.includes("127.0.0.1"))
  ? "development"
  : "production";

const CONFIG = {
  development: {
    API_BASE_URL: "https://donaciones-back-dev-entorno.up.railway.app/api",
    AUTH_URL: "http://localhost:3000/api", // 
  },
  production: {
    API_BASE_URL: "https://donaciones-production.up.railway.app/api",
    AUTH_URL: "https://donaciones-auth-service-production.up.railway.app/api",
  },
};

export const API_BASE_URL = CONFIG[ENV].API_BASE_URL;
export const AUTH_URL = CONFIG[ENV].AUTH_URL;
