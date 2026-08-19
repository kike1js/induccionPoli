const mongoose = require('mongoose');

const estadoExamenSchema = new mongoose.Schema({
    estado: { type: String, enum: ['no_iniciado', 'en_curso', 'finalizado'], default: 'no_iniciado' },
    tiempoRestante: { type: Number, default: 3600 },
    advertencias: { type: Number, default: 0 },
    respuestasTemporales: { type: Object, default: {} },
    marcadasTemporales: { type: Object, default: {} },
    indiceTemporal: { type: Number, default: 0 }
}, { _id: false });

const usuarioSchema = new mongoose.Schema({
  idFirebase: { type: String, required: true, unique: true }, 
  boleta: { type: String, required: true, unique: true },
  curp: { type: String, required: true },
  
  // DATOS PARA ACUSES Y CONTROL ESCOLAR
  nombre: { type: String, required: true, trim: true }, 
  correo: { type: String, trim: true, lowercase: true, default: '' },
  grupo: { type: String, trim: true, default: 'POR DEFINIR' },
  turno: { type: String, trim: true, default: 'MATUTINO' }, 
  
  rol: { 
      type: String, 
      enum: ['alumno', 'administrador', 'profesor'], 
      default: 'alumno'
  },
  
  simuladorInduccion: {
      ciencias_sociales: {
          estadoActual: { type: estadoExamenSchema, default: () => ({}) },
          intentosRealizados: { type: Number, default: 0 },
          bloqueadoPorTrampa: { type: Boolean, default: false },
          mejorPuntaje: { type: Number, default: 0 },
          desglose_materias: { type: Object, default: {} },
          desglose_temas: { type: Object, default: {} },
          desglose_subtemas: { type: Object, default: {} }
      },
      ciencias_exactas: {
          estadoActual: { type: estadoExamenSchema, default: () => ({}) },
          intentosRealizados: { type: Number, default: 0 },
          bloqueadoPorTrampa: { type: Boolean, default: false },
          mejorPuntaje: { type: Number, default: 0 },
          desglose_materias: { type: Object, default: {} },
          desglose_temas: { type: Object, default: {} },
          desglose_subtemas: { type: Object, default: {} } 
      },
      ciencias_experimentales: {
          estadoActual: { type: estadoExamenSchema, default: () => ({}) },
          intentosRealizados: { type: Number, default: 0 },
          bloqueadoPorTrampa: { type: Boolean, default: false },
          mejorPuntaje: { type: Number, default: 0 },
          desglose_materias: { type: Object, default: {} },
          desglose_temas: { type: Object, default: {} },
          desglose_subtemas: { type: Object, default: {} } 
      },
      examenesResueltos: [{ 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'ExamenIntento' 
      }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);