const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

require('./config/passport'); // Configuración de Passport.js

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuración de sesión (necesaria para Passport)
app.use(
  session({
    secret: 'session-secret',
    resave: false,
    saveUninitialized: true
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Rutas de autenticación
app.use(authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor AUTH corriendo en el puerto ${PORT}`);
});
