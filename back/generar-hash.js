// generar-hash.js
const bcrypt = require('bcrypt'); // o 'bcrypt' si ese usás en el proyecto

const passwordPlano = 'Inicio24$'; // la contraseña que vas a usar para loguear

bcrypt.hash(passwordPlano, 10)
  .then(hash => {
    console.log('Hash generado:');
    console.log(hash);
  })
  .catch(err => {
    console.error('Error al generar hash:', err);
  });
