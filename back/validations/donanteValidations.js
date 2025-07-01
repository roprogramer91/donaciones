// validations/donanteValidations.js

const gruposValidos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Valida DNI argentino: 7 u 8 (hasta 9 por safety) dígitos
function validarDNI(dni) {
  return /^\d{7,9}$/.test(dni);
}

// Valida que el grupo sanguíneo sea correcto
function validarGrupo(grupo) {
  return gruposValidos.includes(grupo);
}

// Valida fecha de nacimiento: mayor de 18, no futura
function validarFechaNacimiento(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date();
  const fechaNac = new Date(fecha_nacimiento);

  // Fecha no puede ser futura
  if (fechaNac > hoy) return false;

  // Calcular edad
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  return edad >= 18 && edad <= 65; // opcionalmente poné límite superior
}

// (Si necesitás seguir usando la función por edad numérica)
// function validarEdad(edad) {
//   return typeof edad === 'number' && edad >= 18 && edad <= 65;
// }

module.exports = {
  validarDNI,
  validarGrupo,
  validarFechaNacimiento
};
