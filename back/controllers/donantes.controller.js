// back/controllers/donantes.controller.js
// Controlador para gestionar donantes

// Importaciones necesarias
const Donante = require('../models/donantes.model');
const { validarDNI, validarFechaNacimiento, validarGrupo } = require('../validations/donanteValidations');
const { calcularAptoYRestante } = require('../utils/donanteUtils');

// Crear donante
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

    nuevoDonante.usuario_id = usuarioId;
    if (!nuevoDonante.estado) nuevoDonante.estado = 'activo';

    const donanteCreado = await Donante.guardar(nuevoDonante);
    res.status(201).json({ mensaje: 'Donante agregado exitosamente', donante: donanteCreado });

  } catch (error) {
    console.error('Error al guardar donante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todos los donantes (con cálculo de aptitud)
const obtenerDonantes = async (req, res) => {
  try {
    const donantes = await Donante.obtenerTodos();
    const hoy = new Date();

    const resultado = donantes.map(d => {
      const sexo = d.sexo || 'M';
      const { apto, dias_restantes } = calcularAptoYRestante(d.fecha_ultima_donacion, sexo, hoy);
      return { ...d, apto_para_donar: apto, dias_restantes };
    });

    if (req.query.apto === 'true') {
      return res.json(resultado.filter(d => d.apto_para_donar));
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener donantes:', error);
    res.status(500).json({ error: 'Error al obtener donantes' });
  }
};

// Obtener perfil completo del donante autenticado
const getPerfilDonanteCompleto = async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const perfil = await Donante.getPerfilCompletoByUsuarioId(usuarioId);
    if (!perfil) return res.status(404).json({ error: 'No sos donante registrado' });

    const { apto, dias_restantes } = calcularAptoYRestante(perfil.fecha_ultima_donacion, perfil.sexo);
    perfil.apto_para_donar = apto;
    perfil.dias_restantes = dias_restantes;

    res.json(perfil);
  } catch (err) {
    console.error('Error al traer perfil completo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Buscar donante por email o usuario (usado en logins)
const getDonanteByEmail = async (req, res) => {
  const email = req.user && req.user.email;
  if (!email) return res.status(400).json({ mensaje: 'Email no proporcionado o no autenticado.' });

  try {
    const donante = await Donante.findByEmail(email);
    if (!donante) return res.status(404).json({ mensaje: 'No sos donante' });
    res.json(donante);
  } catch (err) {
    console.error('Error al buscar donante por email:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

// 🔍 Filtrar donantes (para el dashboard del centro)
const filtrarDonantes = async (req, res) => {
  try {
    const filtros = {
      localidad: req.query.localidad,
      barrio: req.query.barrio,
      provincia: req.query.provincia,
      grupo: req.query.grupo,
      estado: req.query.estado
    };

    const donantes = await Donante.filtrar(filtros);
    const hoy = new Date();

    const resultado = donantes.map(d => {
      const sexo = d.sexo || 'M';
      const { apto, dias_restantes } = calcularAptoYRestante(d.fecha_ultima_donacion, sexo, hoy);
      return { ...d, apto_para_donar: apto, dias_restantes };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error al filtrar donantes:', error);
    res.status(500).json({ error: 'Error interno al filtrar donantes' });
  }
};

module.exports = {
  crearDonante,
  obtenerDonantes,
  getDonanteByEmail,
  getPerfilDonanteCompleto,
  filtrarDonantes
};
