const Donante = require('../models/donantes.model');
const { validarDNI, validarFechaNacimiento, validarGrupo } = require('../validations/donanteValidations');
const { calcularAptoYRestante } = require('../utils/donanteUtils');

// Crear donante (igual que antes)
const crearDonante = async (req, res) => {
  const usuarioId = req.user.id;
  const nuevoDonante = req.body;

  if (!validarDNI(nuevoDonante.dni)) {
    return res.status(400).json({ error: 'DNI inválido.' });
  }
  if (!validarGrupo(nuevoDonante.grupo_sanguineo)) {
    return res.status(400).json({ error: 'Grupo sanguíneo inválido.' });
  }
  if (!validarFechaNacimiento(nuevoDonante.fecha_nacimiento)) {
    return res.status(400).json({ error: 'Fecha de nacimiento inválida o menor de 18 años.' });
  }

  try {
    const existente = await Donante.findByDni(nuevoDonante.dni);
    if (existente) {
      return res.status(400).json({ error: 'Ya existe un donante con ese DNI.' });
    }
    if (!nuevoDonante.estado) nuevoDonante.estado = 'activo';
    nuevoDonante.usuario_id = usuarioId;
    const donanteCreado = await Donante.guardar(nuevoDonante);
    res.status(201).json({ mensaje: 'Donante agregado exitosamente', donante: donanteCreado });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un donante con ese DNI.' });
    }
    console.error('Error al guardar donante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};



// Obtener todos los donantes (con cálculo apto y días restantes)
const obtenerDonantes = async (req, res) => {
  try {
    const donantes = await Donante.obtenerTodos();
    const hoy = new Date();
    const donantesConApto = donantes.map(donante => {
      // ATENCIÓN: Asegurate que el campo sexo esté en el registro ('M' para hombre, 'F' para mujer)
      const sexo = donante.sexo || 'M'; // Cambia por el valor correcto o pone un default si falta
      const { apto, dias_restantes } = calcularAptoYRestante(donante.fecha_ultima_donacion, sexo, hoy);
      return {
        ...donante,
        apto_para_donar: apto,
        dias_restantes
      };
    });

    // Filtro: si pasás ?apto=true, solo devuelve los aptos
    if (req.query.apto === 'true') {
      return res.json(donantesConApto.filter(d => d.apto_para_donar));
    }
    res.json(donantesConApto);
  } catch (error) {
    console.error('Error al obtener donantes:', error);
    res.status(500).json({ error: 'Error al obtener donantes' });
  }
};


async function getDonanteByUsuario(req, res) {
  const usuarioId = req.user.id;
  if (!usuarioId) {
    return res.status(400).json({ mensaje: 'Usuario no autenticado' });
  }
  try {
    const donante = await Donante.findByUsuarioId(usuarioId);
    if (donante) {
      res.json(donante);
    } else {
      res.status(404).json({ mensaje: 'No sos donante' });
    }
  } catch (err) {
    console.error('Error al buscar donante por usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

async function getDonanteByEmail(req, res) {
  const email = req.user && req.user.email;
  if (!email) {
    return res.status(400).json({ mensaje: 'Email no proporcionado o no autenticado.' });
  }
  try {
    const donante = await Donante.findByEmail(email);
    if (donante) {
      res.json(donante);
    } else {
      res.status(404).json({ mensaje: 'No sos donante' });
    }
  } catch (err) {
    console.error('Error al buscar donante por email:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}


// Obtener perfil completo del donante autenticado
// Incluye cálculo de aptitud y días restantes
async function getPerfilDonanteCompleto(req, res) {
  const usuarioId = req.user.id;
  try {
    const perfil = await Donante.getPerfilCompletoByUsuarioId(usuarioId);
    if (!perfil) {
      return res.status(404).json({ error: 'No sos donante registrado' });
    }
    // Calculá con el util
    const { apto, dias_restantes } = calcularAptoYRestante(
      perfil.fecha_ultima_donacion, perfil.sexo
    );
    perfil.dias_restantes = dias_restantes;
    perfil.apto_para_donar = apto;
    res.json(perfil);
  } catch (err) {
    console.error('Error al traer perfil completo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }

}

module.exports = {
  crearDonante,
  obtenerDonantes,
  getDonanteByUsuario,
  getDonanteByEmail,
  getPerfilDonanteCompleto
};
