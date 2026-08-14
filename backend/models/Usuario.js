const mongoose = require('mongoose');

// ==========================================
// SUB-ESQUEMA: Memoria Temporal (Auto-Save)
// ==========================================
const estadoExamenSchema = new mongoose.Schema({
    estado: { type: String, enum: ['no_iniciado', 'en_curso', 'finalizado'], default: 'no_iniciado' },
    tiempoRestante: { type: Number, default: 3600 },
    advertencias: { type: Number, default: 0 },
    respuestasTemporales: { type: Object, default: {} },
    marcadasTemporales: { type: Object, default: {} },
    indiceTemporal: { type: Number, default: 0 }
}, { _id: false }); // _id en false para no generar ObjectIds innecesarios en sub-objetos

// ==========================================
// ESQUEMA PRINCIPAL DEL USUARIO
// ==========================================
const usuarioSchema = new mongoose.Schema({
  idFirebase: { type: String, required: true, unique: true }, 
  boleta: { type: Number, required: true, unique: true },
  curp: { type: String, required: true },
  
  // ------------------------------------------
  // NUEVAS PROPIEDADES PARA CONSULTAS Y ACUSES
  // ------------------------------------------
  correo: { 
      type: String, 
      trim: true, 
      lowercase: true, 
      default: '' 
  },
  grupo: { 
      type: String, 
      trim: true, 
      uppercase: true, 
      default: 'SIN GRUPO' 
  },
  
  isOnline: { type: Boolean, default: false },
  lastLogin: { type: Number }, 
  sessionToken: { type: String },
  rol: { 
      type: String, 
      required: true, 
      enum: ['alumno', 'administrador', 'profesor'], 
      default: 'alumno'
  },
  
  simuladorInduccion: {
      ciencias_sociales: {
          estadoActual: { type: estadoExamenSchema, default: () => ({}) },
          intentosRealizados: { type: Number, default: 0 },
          bloqueadoPorTrampa: { type: Boolean, default: false },
          mejorPuntaje: { type: Number, default: 0 },
          desglose_materias: { type: Object, default: {} }
      },
      ciencias_exactas: {
          estadoActual: { type: estadoExamenSchema, default: () => ({}) },
          intentosRealizados: { type: Number, default: 0 },
          bloqueadoPorTrampa: { type: Boolean, default: false },
          mejorPuntaje: { type: Number, default: 0 },
          desglose_materias: { type: Object, default: {} }
      },
      ciencias_experimentales: {
          estadoActual: { type: estadoExamenSchema, default: () => ({}) },
          intentosRealizados: { type: Number, default: 0 },
          bloqueadoPorTrampa: { type: Boolean, default: false },
          mejorPuntaje: { type: Number, default: 0 },
          desglose_materias: { type: Object, default: {} }
      },
      examenesResueltos: [{ 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'ExamenIntento' 
      }]
  }
});

usuarioSchema.virtual('intentosRealizados').get(function() {
    return this.simuladorInduccion.examenesResueltos.length;
});

module.exports = mongoose.model('Usuario', usuarioSchema);