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

/**
 * Aca valido las respuestas del pre-test de donación.
 * @param {object} respuestas - Un objeto con las respuestas del test.
 * @returns {{isValid: boolean, errors: object}} - Un objeto que indica si el test es válido y contiene los errores.
 */
function validarPreTest(respuestas) {
  const errors = {};

  // Defino las reglas y los mensajes de error correspondientes.
  const reglas = {
    edad: { respuestaEsperada: 'si', mensaje: 'Debes tener entre 18 y 65 años.' },
    peso: { respuestaEsperada: 'si', mensaje: 'Debes pesar más de 50 kg.' },
    salud: { respuestaEsperada: 'si', mensaje: 'Debes sentirte en buen estado de salud para donar.' },
    enfermedad: { respuestaEsperada: 'no', mensaje: 'No podés donar si tuviste ciertas enfermedades transmisibles por sangre.' },
    parejas: { respuestaEsperada: 'no', mensaje: 'Las relaciones sexuales sin protección con parejas ocasionales son un factor de riesgo.' },
    drogas: { respuestaEsperada: 'no', mensaje: 'El uso de drogas intravenosas no es compatible con la donación de sangre.' },
    tatuajes: { respuestaEsperada: 'no', mensaje: 'No podés donar si te hiciste tatuajes, piercings o acupuntura en los últimos 6 meses.' }
  };

  for (const pregunta in reglas) {
    if (respuestas[pregunta] !== reglas[pregunta].respuestaEsperada) {
      errors[pregunta] = reglas[pregunta].mensaje;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors
  };
}


module.exports = {
  validarDNI,
  validarGrupo,
  validarFechaNacimiento,
  validarPreTest
};
