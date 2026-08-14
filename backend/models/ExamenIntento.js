const mongoose = require('mongoose');

const examenIntentoSchema = new mongoose.Schema({
    // Enlace al alumno que hizo el examen
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    boleta_alumno: { type: String, required: true },
    
    // Clasificación del examen
    area_examen: {
        type: String, 
        required: true, 
        enum: ['ciencias sociales', 'ciencias exactas', 'ciencias experimentales']
    },

    // Datos del intento (Lo que empaquetamos en el frontend)
    fecha_intento: { type: Date, default: Date.now },
    motivo_finalizacion: { type: String, required: true }, // "terminado_por_usuario", "trampa", "tiempo_agotado"
    tiempo_restante_segundos: { type: Number, default: 0 },
    advertencias_cometidas: { type: Number, default: 0 },
    examen_anulado: { type: Boolean, default: false }, // true si lo atraparon haciendo trampa
    
    // Aquí guardamos el JSON crudo con la letra que eligió en cada pregunta { "0": "A", "1": "C" }
    respuestas_crudas: { type: Object, default: {} },

    // Estadísticas calculadas por el Backend
    aciertos: { type: Number, default: 0 },
    calificacion_final: { type: Number, default: 0 },
    desglose_materias: { type: Object, default: {} }
});

module.exports = mongoose.model('ExamenIntento', examenIntentoSchema);