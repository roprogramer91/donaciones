// back/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

// Importar rutas
const donantesRoutes = require('./routes/donantes.routes');
const userRoutes = require('./routes/user.routes');
const provinciasRoutes = require('./routes/provinciasRoutes');
const localidadesRoutes = require('./routes/localidadesRoutes');
const barriosRoutes = require('./routes/barriosRoutes');
const campaniasRoutes = require('./routes/campanias.routes');
const centroRoutes = require('./routes/centro.routes');
const authRoutes = require('./services/auth/routes/auth.routes');
const usuariosRoutes = require('./services/auth/routes/usuarios.routes');
const adminRoutes = require('./services/auth/routes/admin.routes');


// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

// routes
app.use('/api/donantes', donantesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/provincias', provinciasRoutes);
app.use('/api/localidades', localidadesRoutes);
app.use('/api/barrios', barriosRoutes);
app.use('/api/campanias', campaniasRoutes);
app.use('/api/centro', centroRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admin', adminRoutes);






// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Test endpoint para verificar que el servidor está funcionando
app.get('/back', (req, res) => {
  res.send('Servidor funcionando OK');
});

// TEST DE CONEXIÓN A LA BASE DE DATOS
// Este endpoint es solo para verificar la conexión a la base de datos
app.use('/api/test-db', require('./data/probarconexion'));

module.exports = app;
