// En este script genero un hash para pruebas manuales
const bcrypt = require('bcrypt');

const passwordPlano = 'Inicio24$'; // Aqui defino la clave que quiero probar

bcrypt.hash(passwordPlano, 10)
  .then(hash => {
    console.log('Hash generado:');
    console.log(hash);
  })
  .catch(err => {
    console.error('Error al generar hash:', err);
  });
