// En este archivo levanto la app de Express y conecto cada modulo
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser"); // Importo cookie-parser
const app = express();
require("./workers/cumpleanios.worker"); // Activo el worker de cumpleaños

// aca importo las rutas principales
const donantesRoutes = require("./routes/donantes.routes");
const userRoutes = require("./routes/user.routes");
const provinciasRoutes = require("./routes/provinciasRoutes");
const localidadesRoutes = require("./routes/localidadesRoutes");
const barriosRoutes = require("./routes/barriosRoutes");
const campaniasRoutes = require("./routes/campanias.routes");
const centroRoutes = require("./routes/centro.routes"); // Este import está duplicado, lo dejo por ahora
const authRoutes = require("./services/auth/routes/auth.routes");
const usuariosRoutes = require("./services/auth/routes/usuarios.routes");
const adminRoutes = require("./routes/admin.routes");
const testDbRoutes = require("./routes/testdb.routes");

// aca configuro los middlewares base
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());
app.use(cookieParser()); // Lo uso como middleware para que el servidor entienda las cookies

// aca engancho cada grupo de rutas
app.use("/api/donantes", donantesRoutes);
app.use("/api/user", userRoutes);
app.use("/api/provincias", provinciasRoutes);
app.use("/api/localidades", localidadesRoutes);
app.use("/api/barrios", barriosRoutes);
app.use("/api/campanias", campaniasRoutes);
app.use("/api/centro", centroRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/test-db", testDbRoutes);

// aca levanto el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Uso este ping para confirmar rapido que el servidor responde
app.get("/back", (req, res) => {
  res.send("Servidor funcionando OK");
});

module.exports = app;
