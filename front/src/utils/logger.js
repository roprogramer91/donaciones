// front/src/utils/logger.js

const host = window.location.hostname || "";
const isDevHost =
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "::1" ||
  host.endsWith(".local");

const ENV = isDevHost ? "development" : "production";

export const appLogger = {
  log: (...args) => {
    if (ENV === "development") console.log("✅", ...args);
  },
  warn: (...args) => {
    if (ENV === "development") console.warn("⚠️", ...args);
  },
  error: (...args) => {
    console.error("❌", ...args);
  },
};

export default appLogger;
