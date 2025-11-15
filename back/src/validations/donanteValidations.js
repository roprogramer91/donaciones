// En este archivo valido los campos claves de un donante
const gruposValidos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Aqui valido el formato de DNI argentino
function validarDNI(dni) {
  return /^\d{7,9}$/.test(dni);
}

// Aqui valido que el grupo sanguineo sea correcto
function validarGrupo(grupo) {
  return gruposValidos.includes(grupo);
}

// Aqui valido la fecha de nacimiento y la edad
function validarFechaNacimiento(fecha_nacimiento) {
  if (!fecha_nacimiento) return false;
  const hoy = new Date();
  const fechaNac = new Date(fecha_nacimiento);

  if (fechaNac > hoy) return false;

  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mes = hoy.getMonth() - fechaNac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  return edad >= 18 && edad <= 65;
}

module.exports = {
  validarDNI,
  validarGrupo,
  validarFechaNacimiento
};
