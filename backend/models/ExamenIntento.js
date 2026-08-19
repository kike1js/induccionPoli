const mongoose = require('mongoose');

const examenIntentoSchema = new mongoose.Schema({
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    boleta_alumno: { type: String, required: true },
    
    area_examen: {
        type: String, 
        required: true, 
        enum: ['ciencias sociales', 'ciencias exactas', 'ciencias experimentales']
    },

    fecha_intento: { type: Date, default: Date.now },
    motivo_finalizacion: { type: String, required: true },
    tiempo_restante_segundos: { type: Number, default: 0 },
    advertencias_cometidas: { type: Number, default: 0 },
    examen_anulado: { type: Boolean, default: false },
    
    respuestas_crudas: { type: Object, default: {} },

    aciertos: { type: Number, default: 0 },
    calificacion_final: { type: Number, default: 0 },
    
    desglose_materias: { type: Object, default: {} },
    desglose_temas: { type: Object, default: {} },
    desglose_subtemas: { type: Object, default: {} } 
});

module.exports = mongoose.model('ExamenIntento', examenIntentoSchema);