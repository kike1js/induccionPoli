const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto'); 

// Importar modelos
const Usuario = require('./models/Usuario'); 
const ExamenIntento = require('./models/ExamenIntento');
// IMPORTAMOS TODAS LAS CLAVES DE LA BÓVEDA
const { clavesSociales, clavesExactas, clavesExperimentales } = require('./claves_examen');

const app = express();

// ==========================================
// 1. CONFIGURACIÓN Y MIDDLEWARES (SIEMPRE ARRIBA)
// ==========================================
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27019/induccion_db';

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Vital para leer req.body y procesar CSV pesados

// ==========================================
// 2. CONEXIÓN A MONGODB
// ==========================================
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB (Inducción Politécnica)'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// ==========================================
// 3. RUTAS DE UTILERÍA Y SEMBRADO
// ==========================================

// SEED MULTI-USUARIO (Actualizado con Grupo y Correo)
app.get('/api/utilerias/seed', async (req, res) => {
    try {
        const resultados = [];

        // 1. Crear Administrador
        const adminBoleta = 2025000000;
        let adminExistente = await Usuario.findOne({ boleta: adminBoleta });
        if (!adminExistente) {
            const adminUser = new Usuario({
                idFirebase: 'admin_poliaprende_001',
                boleta: adminBoleta,
                curp: 'ADMIN1234567890',
                correo: 'admin@cecyt.mx',
                grupo: 'ADMIN',
                rol: 'administrador',
                isOnline: false
            });
            await adminUser.save();
            resultados.push('Administrador creado (Boleta: 2025000000)');
        } else {
            resultados.push('Administrador ya existía.');
        }

        // 2. Conservar tu Alumno Principal
        const boletaPrincipal = 2025630152;
        let principalExistente = await Usuario.findOne({ boleta: boletaPrincipal });
        if (!principalExistente) {
            const nuevoPrincipal = new Usuario({
                idFirebase: 'semilla-prueba-123',
                boleta: boletaPrincipal,
                curp: 'ZESE060222HMCMLNA7',
                correo: 'alumno1@cecyt.mx',
                grupo: '4IV15',
                rol: 'alumno',
                isOnline: false,
                simuladorInduccion: {
                    ciencias_sociales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                    ciencias_exactas: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                    ciencias_experimentales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } }
                }
            });
            await nuevoPrincipal.save();
            resultados.push('Alumno Principal creado de cero (Grupo: 4IV15).');
        } else {
            resultados.push('Alumno Principal protegido.');
        }

        // 3. Crear Alumno Extra para Estadísticas
        const boletaExtra = 2025111111;
        let extraExistente = await Usuario.findOne({ boleta: boletaExtra });
        if (!extraExistente) {
            const nuevoExtra = new Usuario({
                idFirebase: 'alumno_extra_002',
                boleta: boletaExtra,
                curp: 'ALUMNOEXTRA123',
                correo: 'alumno2@cecyt.mx',
                grupo: '4IV15',
                rol: 'alumno',
                isOnline: false,
                simuladorInduccion: {
                    ciencias_sociales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                    ciencias_exactas: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                    ciencias_experimentales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } }
                }
            });
            await nuevoExtra.save();
            resultados.push('Alumno Extra creado (Boleta: 2025111111, Grupo: 4IV15)');
        } else {
            resultados.push('Alumno Extra ya existía.');
        }

        return res.status(200).json({ mensaje: 'Seed Finalizado', detalles: resultados });

    } catch (error) {
        console.error('Error en Seed:', error);
        res.status(500).json({ error: 'Error inyectando semilla: ' + error.message });
    }
});

// DESBLOQUEAR ALUMNOS Y REINICIAR MEMORIA
app.get('/api/utilerias/perdonar/:boleta', async (req, res) => {
    try {
        const estadoVacio = { estado: 'no_iniciado', tiempoRestante: 3600, advertencias: 0, respuestasTemporales: {}, marcadasTemporales: {}, indiceTemporal: 0 };
        await Usuario.updateOne(
            { boleta: Number(req.params.boleta) },
            { 
                $set: { 
                    'simuladorInduccion.ciencias_sociales.bloqueadoPorTrampa': false,
                    'simuladorInduccion.ciencias_exactas.bloqueadoPorTrampa': false,
                    'simuladorInduccion.ciencias_experimentales.bloqueadoPorTrampa': false,
                    'simuladorInduccion.ciencias_sociales.estadoActual': estadoVacio,
                    'simuladorInduccion.ciencias_exactas.estadoActual': estadoVacio,
                    'simuladorInduccion.ciencias_experimentales.estadoActual': estadoVacio,
                    'simuladorInduccion.ciencias_sociales.intentosRealizados': 0,
                    'simuladorInduccion.ciencias_exactas.intentosRealizados': 0,
                    'simuladorInduccion.ciencias_experimentales.intentosRealizados': 0,
                    sessionToken: null, isOnline: false 
                } 
            }
        );
        res.status(200).json({ mensaje: `El alumno ${req.params.boleta} ha sido perdonado. (Memoria, bloqueos e intentos en 0).` });
    } catch (error) {
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

// ==========================================
// 4. RUTAS PRINCIPALES DEL SIMULADOR
// ==========================================
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: '¡El motor del simulador está en línea!' });
});

// LOGIN
app.post('/api/examen/login', async (req, res) => {
    try {
        const { boleta, curp } = req.body;
        if (!boleta || !curp) return res.status(400).json({ error: 'Boleta y CURP son obligatorios.' });

        const usuario = await Usuario.findOne({ boleta: Number(boleta), curp: curp });
        if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas o alumno no registrado.' });

        const sessionToken = "token_ipn_" + Math.random().toString(36).substr(2);
        await Usuario.updateOne({ _id: usuario._id }, { $set: { sessionToken: sessionToken, lastLogin: Date.now(), isOnline: true } });

        res.status(200).json({
            mensaje: 'Login exitoso', token: sessionToken,
            usuario: { boleta: usuario.boleta, rol: usuario.rol, idFirebase: usuario.idFirebase, grupo: usuario.grupo, correo: usuario.correo },
            simulador: usuario.simuladorInduccion || {}
        });
    } catch (error) {
        console.error("Error interno en login:", error);
        res.status(500).json({ error: 'Error interno: ' + error.message });
    }
});

// VERIFICAR SESIÓN (Perro Guardián)
app.post('/api/examen/verify', async (req, res) => {
    try {
        const { boleta, token } = req.body;
        if (!boleta || !token) return res.status(400).json({ valida: false, error: 'Datos insuficientes.' });
        
        const usuario = await Usuario.findOne({ boleta: Number(boleta), sessionToken: token, isOnline: true });
        if (usuario) return res.status(200).json({ valida: true });
        else return res.status(401).json({ valida: false, error: 'Sesión inválida o expirada.' });
    } catch (error) {
        res.status(500).json({ valida: false, error: 'Error interno del servidor.' });
    }
});

// CERRAR SESIÓN
app.post('/api/examen/logout', async (req, res) => {
    try {
        const { boleta } = req.body;
        if (boleta) await Usuario.updateOne({ boleta: Number(boleta) }, { $set: { sessionToken: null, isOnline: false } });
        res.status(200).json({ mensaje: 'Sesión terminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// AUTOGUARDAR PROGRESO (Blindado contra fantasmas de red)
app.post('/api/examen/autoguardar', async (req, res) => {
    try {
        const { boleta, area, estado, tiempoRestante, advertencias, respuestas, marcadas, indice } = req.body;
        let areaNormalizada = (area || "").toLowerCase().trim();
        let campoArea = "ciencias_sociales"; 
        if (areaNormalizada.includes('exacta')) campoArea = "ciencias_exactas";
        if (areaNormalizada.includes('experi')) campoArea = "ciencias_experimentales";

        const usuario = await Usuario.findOne({ boleta: Number(boleta) });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const intentosPrevios = usuario.simuladorInduccion?.[campoArea]?.intentosRealizados || 0;
        
        if (intentosPrevios >= 1) {
            return res.status(200).json({ success: true, mensaje: "Ignorado: El examen ya fue entregado." });
        }

        const updatePath = `simuladorInduccion.${campoArea}.estadoActual`;
        await Usuario.updateOne(
            { boleta: Number(boleta) },
            { $set: { 
                [`${updatePath}.estado`]: estado || "en_curso",
                [`${updatePath}.tiempoRestante`]: tiempoRestante,
                [`${updatePath}.advertencias`]: advertencias || 0,
                [`${updatePath}.respuestasTemporales`]: respuestas || {},
                [`${updatePath}.marcadasTemporales`]: marcadas || {},
                [`${updatePath}.indiceTemporal`]: indice || 0
            } }
        );
        res.status(200).json({ success: true, mensaje: "Progreso autoguardado" });
    } catch (error) {
        res.status(500).json({ error: 'Error interno autoguardando' });
    }
});

// RECIBIR Y CALIFICAR EXAMEN (Blindado contra dobles envíos)
app.post('/api/examen/entregar', async (req, res) => {
    try {
        const payload = req.body;
        const usuario = await Usuario.findOne({ boleta: Number(payload.boleta) });
        if (!usuario) return res.status(404).json({ error: 'Alumno no encontrado.' });

        let areaNormalizada = (payload.area_examen || "").toLowerCase().trim();
        let campoArea = "ciencias_sociales"; 
        if (areaNormalizada.includes('exacta')) campoArea = "ciencias_exactas";
        if (areaNormalizada.includes('experi')) campoArea = "ciencias_experimentales";

        const intentosPrevios = usuario.simuladorInduccion?.[campoArea]?.intentosRealizados || 0;
        
        if (intentosPrevios >= 1) {
            console.warn(`[Seguridad] Intento duplicado bloqueado para boleta: ${payload.boleta} en área: ${areaNormalizada}`);
            return res.status(403).json({ 
                codigo: "EXAMEN_DUPLICADO", 
                error: "Violación de seguridad: El alumno ya tiene un examen completado en esta área." 
            });
        }

        let clavesCorrectas;
        if (areaNormalizada === "ciencias sociales") clavesCorrectas = clavesSociales;
        else if (areaNormalizada === "ciencias exactas") clavesCorrectas = clavesExactas;
        else if (areaNormalizada === "ciencias experimentales") clavesCorrectas = clavesExperimentales;
        else return res.status(400).json({ error: 'Área de examen no reconocida.' });

        let aciertosTotales = 0;
        const totalReactivos = Object.keys(clavesCorrectas).length; 
        const desglose = {}; 

        for (const indice in clavesCorrectas) {
            const matInfo = clavesCorrectas[indice].materia;
            if (!desglose[matInfo]) desglose[matInfo] = { aciertos: 0, total: 0 };
            desglose[matInfo].total++;
        }

        if (!payload.examen_anulado) {
            for (const indice in payload.respuestas) {
                if (clavesCorrectas[indice] && payload.respuestas[indice] === clavesCorrectas[indice].respuesta) {
                    aciertosTotales++; 
                    desglose[clavesCorrectas[indice].materia].aciertos++;
                }
            }
        }

        const calificacionBase10 = totalReactivos > 0 ? (aciertosTotales / totalReactivos) * 10 : 0;
        const nuevoIntento = new ExamenIntento({
            usuario: usuario._id, 
            boleta_alumno: payload.boleta, 
            area_examen: areaNormalizada,
            motivo_finalizacion: payload.motivo_finalizacion, 
            tiempo_restante_segundos: payload.tiempo_restante_segundos,
            advertencias_cometidas: payload.advertencias_cometidas, 
            examen_anulado: payload.examen_anulado,
            respuestas_crudas: payload.respuestas, 
            aciertos: aciertosTotales,
            calificacion_final: parseFloat(calificacionBase10.toFixed(2)), 
            desglose_materias: desglose
        });
        await nuevoIntento.save();

        const updateQuery = {
            $inc: { [`simuladorInduccion.${campoArea}.intentosRealizados`]: 1 },
            $push: { 'simuladorInduccion.examenesResueltos': nuevoIntento._id },
            $set: {
                [`simuladorInduccion.${campoArea}.estadoActual.estado`]: "finalizado",
                [`simuladorInduccion.${campoArea}.estadoActual.respuestasTemporales`]: {},
                [`simuladorInduccion.${campoArea}.estadoActual.marcadasTemporales`]: {}
            }
        };

        if (payload.examen_anulado) {
            updateQuery.$set[`simuladorInduccion.${campoArea}.bloqueadoPorTrampa`] = true;
        } else {
            const puntajePrevio = usuario.simuladorInduccion?.[campoArea]?.mejorPuntaje || 0;
            if (aciertosTotales >= puntajePrevio) {
                updateQuery.$set[`simuladorInduccion.${campoArea}.mejorPuntaje`] = aciertosTotales;
                updateQuery.$set[`simuladorInduccion.${campoArea}.desglose_materias`] = desglose;
            }
        }

        await Usuario.updateOne({ _id: usuario._id }, updateQuery);
        
        res.status(200).json({ 
            mensaje: "Examen recibido", 
            aciertos: aciertosTotales, 
            total: totalReactivos, 
            calificacion: parseFloat(calificacionBase10.toFixed(2)), 
            anulado: payload.examen_anulado, 
            area_examen: areaNormalizada, 
            desglose_materias: desglose 
        });

    } catch (error) {
        res.status(500).json({ error: 'Error interno: ' + error.message });
    }
});

// ==========================================
// 5. RUTAS ADMINISTRATIVAS Y DE ESTADÍSTICAS
// ==========================================

// CARGA MASIVA DE USUARIOS (Adaptado para recibir Grupo y Correo)
app.post('/api/usuarios/generador', async (req, res) => {
    try {
        const usuariosNuevos = req.body;
        if (!Array.isArray(usuariosNuevos)) return res.status(400).json({ error: 'Se esperaba un arreglo de usuarios.' });

        const resultados = { insertados: 0, errores: [] };

        for (const user of usuariosNuevos) {
            try {
                const boletaNum = Number(user.boleta);
                if (isNaN(boletaNum)) throw new Error("Boleta inválida");

                const existe = await Usuario.findOne({ boleta: boletaNum });
                if (existe) {
                    resultados.errores.push(`La boleta ${boletaNum} ya existe.`);
                    continue;
                }

                const nuevoUsuario = new Usuario({
                    idFirebase: crypto.randomUUID(), 
                    boleta: boletaNum,
                    curp: user.curp.toUpperCase(),
                    correo: user.correo ? user.correo.trim().toLowerCase() : '',
                    grupo: user.grupo ? user.grupo.toUpperCase().trim() : 'SIN GRUPO',
                    rol: user.rol || 'alumno',
                    isOnline: false,
                    simuladorInduccion: {
                        ciencias_sociales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                        ciencias_exactas: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                        ciencias_experimentales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } }
                    }
                });

                await nuevoUsuario.save();
                resultados.insertados++;
            } catch (err) {
                resultados.errores.push(`Error con boleta ${user.boleta}: ${err.message}`);
            }
        }
        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// REPORTE ESTADÍSTICO GLOBAL (Con Tramposos Anulados)
app.get('/api/examen/reporte-estadisticas', async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        const query = {};

        if (fechaInicio && fechaFin) {
            const start = new Date(fechaInicio); start.setHours(0, 0, 0, 0);
            const end = new Date(fechaFin); end.setHours(23, 59, 59, 999);
            query.fecha_intento = { $gte: start, $lte: end };
        }

        const intentos = await ExamenIntento.find(query);

        let totalSociales = 0, totalExactas = 0, totalExperimentales = 0;
        let sumaSociales = 0, sumaExactas = 0, sumaExperimentales = 0;
        let materiasStats = {}; 
        let usuariosSet = new Set();
        let usuariosPorArea = { sociales: new Set(), exactas: new Set(), experimentales: new Set() };

        let examenesAnuladosPorTrampa = 0;

        intentos.forEach(intento => {
            const userIdStr = intento.usuario.toString();
            usuariosSet.add(userIdStr);
            const area = intento.area_examen;

            if (intento.examen_anulado === true) {
                examenesAnuladosPorTrampa++;
            }

            const calificacion = intento.calificacion_final;

            if (area === 'ciencias sociales') { totalSociales++; sumaSociales += calificacion; usuariosPorArea.sociales.add(userIdStr); }
            else if (area === 'ciencias exactas') { totalExactas++; sumaExactas += calificacion; usuariosPorArea.exactas.add(userIdStr); }
            else if (area === 'ciencias experimentales') { totalExperimentales++; sumaExperimentales += calificacion; usuariosPorArea.experimentales.add(userIdStr); }

            if (intento.desglose_materias) {
                for (const [materia, stats] of Object.entries(intento.desglose_materias)) {
                    if (!materiasStats[materia]) materiasStats[materia] = { aciertos: 0, total: 0 };
                    materiasStats[materia].aciertos += stats.aciertos;
                    materiasStats[materia].total += stats.total;
                }
            }
        });

        let alumnosCompletos = 0;
        usuariosSet.forEach(userId => {
            if (usuariosPorArea.sociales.has(userId) && usuariosPorArea.exactas.has(userId) && usuariosPorArea.experimentales.has(userId)) alumnosCompletos++;
        });

        const promSociales = totalSociales > 0 ? (sumaSociales / totalSociales).toFixed(2) : 0;
        const promExactas = totalExactas > 0 ? (sumaExactas / totalExactas).toFixed(2) : 0;
        const promExperimentales = totalExperimentales > 0 ? (sumaExperimentales / totalExperimentales).toFixed(2) : 0;

        const rendimientoMaterias = Object.keys(materiasStats).map(materia => {
            const stats = materiasStats[materia];
            const porcentaje = stats.total > 0 ? ((stats.aciertos / stats.total) * 100).toFixed(2) : 0;
            return { materia, porcentaje: parseFloat(porcentaje) };
        }).sort((a, b) => a.porcentaje - b.porcentaje); 

        res.status(200).json({
            rango: { fechaInicio, fechaFin },
            participacion: { 
                totalExamenes: intentos.length, 
                alumnosUnicos: usuariosSet.size, 
                alumnosCompletaronTodo: alumnosCompletos, 
                examenesAnuladosPorTrampa: examenesAnuladosPorTrampa,
                porArea: { sociales: totalSociales, exactas: totalExactas, experimentales: totalExperimentales } 
            },
            promedios: { sociales: parseFloat(promSociales), exactas: parseFloat(promExactas), experimentales: parseFloat(promExperimentales) },
            puntosDebiles: rendimientoMaterias.slice(0, 10) 
        });
    } catch (error) {
        res.status(500).json({ error: "Error interno" });
    }
});

// REPORTE INDIVIDUAL (ACUSE POR ALUMNO)
app.get('/api/examen/reporte-individual/:boleta', async (req, res) => {
    try {
        const boleta = Number(req.params.boleta);
        const usuario = await Usuario.findOne({ boleta: boleta }).populate('simuladorInduccion.examenesResueltos');

        if (!usuario) return res.status(404).json({ error: 'Alumno no encontrado en la base de datos.' });

        const examenes = usuario.simuladorInduccion.examenesResueltos || [];
        let resultadosPorArea = {
            sociales: { calificacion: 'Pendiente', anulado: false }, exactas: { calificacion: 'Pendiente', anulado: false }, experimentales: { calificacion: 'Pendiente', anulado: false }
        };
        let desgloseTotal = {};

        examenes.forEach(ex => {
            let areaKey = '';
            if (ex.area_examen.includes('sociales')) areaKey = 'sociales';
            if (ex.area_examen.includes('exactas')) areaKey = 'exactas';
            if (ex.area_examen.includes('experimentales')) areaKey = 'experimentales';

            if (areaKey && (resultadosPorArea[areaKey].calificacion === 'Pendiente' || ex.calificacion_final > resultadosPorArea[areaKey].calificacion)) {
                resultadosPorArea[areaKey] = { calificacion: ex.calificacion_final, anulado: ex.examen_anulado };
            }

            if (ex.desglose_materias) {
                for (const [materia, stats] of Object.entries(ex.desglose_materias)) {
                    if (!desgloseTotal[materia]) desgloseTotal[materia] = { aciertos: 0, total: 0 };
                    desgloseTotal[materia].aciertos += stats.aciertos; desgloseTotal[materia].total += stats.total;
                }
            }
        });

        const rendimientoMaterias = Object.keys(desgloseTotal).map(materia => {
            const stats = desgloseTotal[materia];
            const porcentaje = stats.total > 0 ? ((stats.aciertos / stats.total) * 100).toFixed(2) : 0;
            return { materia, porcentaje: parseFloat(porcentaje) };
        }).sort((a, b) => a.porcentaje - b.porcentaje); 

        res.status(200).json({ boleta: usuario.boleta, curp: usuario.curp, areas: resultadosPorArea, puntosDebiles: rendimientoMaterias.slice(0, 10) });
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// STATS EN VIVO DEL DASHBOARD DEL ALUMNO
app.get('/api/examen/stats/:boleta', async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ boleta: Number(req.params.boleta) }).populate('simuladorInduccion.examenesResueltos'); 
        if (!usuario) return res.status(404).json({ error: 'Alumno no encontrado.' });
        res.status(200).json(usuario.simuladorInduccion || {});
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// RECUPERAR ESTADO TEMPORAL DEL EXAMEN EN CURSO
app.get('/api/examen/estado-vivo/:boleta/:area', async (req, res) => {
    try {
        const { boleta, area } = req.params;
        const usuario = await Usuario.findOne({ boleta: Number(boleta) });
        if (!usuario) return res.status(404).json({ error: 'Alumno no encontrado' });

        let campoArea = "ciencias_sociales";
        if (area.includes('exacta')) campoArea = "ciencias_exactas";
        if (area.includes('experi')) campoArea = "ciencias_experimentales";

        res.status(200).json(usuario.simuladorInduccion?.[campoArea]?.estadoActual || null);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER REPORTE DETALLADO PROFESOR (SOPORTA FILTRO POR GRUPO, TRAMPOSOS Y FECHAS)
app.get('/api/examen/reporte-profesor', async (req, res) => {
    try {
        const { grupo, fechaInicio, fechaFin } = req.query;
        
        let filtroUsuario = { rol: 'alumno' };
        if (grupo) {
            filtroUsuario.grupo = grupo.toUpperCase().trim();
        }

        // Buscamos a los alumnos con sus exámenes resueltos
        const alumnos = await Usuario.find(filtroUsuario).populate('simuladorInduccion.examenesResueltos');

        let totalTramposos = 0;
        let listaTramposos = [];
        let totalAlumnosConActividad = 0;

        // Limites de fecha si fueron enviados
        let start = null, end = null;
        if (fechaInicio && fechaFin) {
            start = new Date(fechaInicio); start.setHours(0, 0, 0, 0);
            end = new Date(fechaFin); end.setHours(23, 59, 59, 999);
        }

        alumnos.forEach(alumno => {
            let hizoTrampa = false;
            let examenesConTrampa = [];
            let tuvoActividadEnPeriodo = false;

            // Revisamos cada examen resuelto del alumno
            alumno.simuladorInduccion.examenesResueltos.forEach(intento => {
                
                // Filtro de fechas por cada intento
                let dentroDeFecha = true;
                if (start && end && intento.fecha_intento) {
                    const fechaIntento = new Date(intento.fecha_intento);
                    if (fechaIntento < start || fechaIntento > end) {
                        dentroDeFecha = false;
                    }
                }

                if (dentroDeFecha) {
                    tuvoActividadEnPeriodo = true;
                    if (intento.examen_anulado) {
                        hizoTrampa = true;
                        examenesConTrampa.push(intento.area_examen);
                    }
                }
            });

            if (tuvoActividadEnPeriodo) {
                totalAlumnosConActividad++;
            }

            if (hizoTrampa) {
                totalTramposos++;
                listaTramposos.push({
                    boleta: alumno.boleta,
                    curp: alumno.curp,
                    correo: alumno.correo,
                    grupo: alumno.grupo,
                    examenesAnulados: examenesConTrampa
                });
            }
        });

        res.status(200).json({
            filtroGrupo: grupo || 'TODOS LOS GRUPOS',
            // Solo contamos a los alumnos que tuvieron actividad en ese rango de fechas
            totalAlumnosConsultados: start ? totalAlumnosConActividad : alumnos.length, 
            totalTramposos,
            listaTramposos
        });

    } catch (error) {
        res.status(500).json({ error: 'Error al generar reporte: ' + error.message });
    }
});

// ==========================================
// 6. INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
