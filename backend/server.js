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
// 3. RUTAS DE UTILERÍA Y SEMBRADO (Limpieza Total)
// ==========================================

app.get('/api/utilerias/seed', async (req, res) => {
    try {
        const resultados = [];

        await Usuario.deleteMany({});
        await ExamenIntento.deleteMany({});
        resultados.push('Base de datos limpiada exitosamente.');

        // 1. Administrador
        const adminUser = new Usuario({
            idFirebase: 'admin_poliaprende_001',
            boleta: "2025000000",
            curp: 'ADMIN1234567890',
            nombre: 'Admin Cecyt',
            correo: 'admin@cecyt.mx',
            grupo: 'ADMIN',
            turno: 'MATUTINO', // ¡NUEVO!
            rol: 'administrador',
            isOnline: false
        });
        await adminUser.save();
        resultados.push('Administrador creado: Admin Cecyt');

        // 2. Alumno Principal
        const nuevoPrincipal = new Usuario({
            idFirebase: 'semilla-prueba-123',
            boleta: "2025630152",
            curp: 'ZESE060222HMCMLNA7',
            nombre: 'Enrique Salinas',
            correo: 'alumno1@cecyt.mx',
            grupo: '4IV15',
            turno: 'VESPERTINO', // ¡NUEVO!
            rol: 'alumno',
            isOnline: false,
            simuladorInduccion: {
                ciencias_sociales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                ciencias_exactas: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                ciencias_experimentales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } }
            }
        });
        await nuevoPrincipal.save();
        resultados.push('Alumno Principal creado: Enrique Salinas (Turno: Vespertino)');

        // 3. Alumno Extra
        const nuevoExtra = new Usuario({
            idFirebase: 'alumno_extra_002',
            boleta: "2025111111",
            curp: 'ALUMNOEXTRA123',
            nombre: 'Jorge Perez',
            correo: 'alumno2@cecyt.mx',
            grupo: '4IM11',
            turno: 'MATUTINO', // ¡NUEVO!
            rol: 'alumno',
            isOnline: false,
            simuladorInduccion: {
                ciencias_sociales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                ciencias_exactas: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } },
                ciencias_experimentales: { estadoActual: { estado: 'no_iniciado', tiempoRestante: 3600 } }
            }
        });
        await nuevoExtra.save();
        resultados.push('Alumno Extra creado: Jorge Perez (Turno: Matutino)');

        return res.status(200).json({ mensaje: 'Replantado con Turno Finalizado', detalles: resultados });

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

//ENTREGAR EXAMEN
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
            console.warn(`[Seguridad] Intento duplicado bloqueado para boleta: ${payload.boleta}`);
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
        
        const desgloseMaterias = {}; 
        const desgloseTemas = {}; 
        const desgloseSubtemas = {}; 

        // 1. Inicializar estructuras
        for (const indice in clavesCorrectas) {
            const item = clavesCorrectas[indice];
            const matInfo = item.materia || "General";
            const temaInfo = item.tema || "General";
            const subtemaInfo = item.subtema || "General";

            if (!desgloseMaterias[matInfo]) desgloseMaterias[matInfo] = { aciertos: 0, total: 0, ratio: "0/0" };
            desgloseMaterias[matInfo].total++;

            if (!desgloseTemas[temaInfo]) desgloseTemas[temaInfo] = { aciertos: 0, total: 0, ratio: "0/0" };
            desgloseTemas[temaInfo].total++;

            if (!desgloseSubtemas[subtemaInfo]) desgloseSubtemas[subtemaInfo] = { aciertos: 0, total: 0, ratio: "0/0" };
            desgloseSubtemas[subtemaInfo].total++;
        }

        // 2. Evaluar Respuestas
        if (!payload.examen_anulado) {
            for (const indice in payload.respuestas) {
                const itemClave = clavesCorrectas[indice];
                if (itemClave && payload.respuestas[indice] === itemClave.respuesta) {
                    aciertosTotales++; 
                    const mat = itemClave.materia || "General";
                    const tema = itemClave.tema || "General";
                    const subtema = itemClave.subtema || "General";

                    if (desgloseMaterias[mat]) desgloseMaterias[mat].aciertos++;
                    if (desgloseTemas[tema]) desgloseTemas[tema].aciertos++;
                    if (desgloseSubtemas[subtema]) desgloseSubtemas[subtema].aciertos++;
                }
            }
        }

        Object.keys(desgloseMaterias).forEach(m => {
            desgloseMaterias[m].ratio = `${desgloseMaterias[m].aciertos}/${desgloseMaterias[m].total}`;
        });
        Object.keys(desgloseTemas).forEach(t => {
            desgloseTemas[t].ratio = `${desgloseTemas[t].aciertos}/${desgloseTemas[t].total}`;
        });
        Object.keys(desgloseSubtemas).forEach(st => {
            desgloseSubtemas[st].ratio = `${desgloseSubtemas[st].aciertos}/${desgloseSubtemas[st].total}`;
        });

        const calificacionBase10 = totalReactivos > 0 ? (aciertosTotales / totalReactivos) * 10 : 0;
        
        // 4. Crear Intento
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
            desglose_materias: desgloseMaterias,
            desglose_temas: desgloseTemas,
            desglose_subtemas: desgloseSubtemas 
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
                updateQuery.$set[`simuladorInduccion.${campoArea}.desglose_materias`] = desgloseMaterias;
                updateQuery.$set[`simuladorInduccion.${campoArea}.desglose_temas`] = desgloseTemas;
                updateQuery.$set[`simuladorInduccion.${campoArea}.desglose_subtemas`] = desgloseSubtemas; 
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
            desglose_materias: desgloseMaterias,
            desglose_temas: desgloseTemas,
            desglose_subtemas: desgloseSubtemas 
        });

    } catch (error) {
        console.error('Error al entregar examen:', error);
        res.status(500).json({ error: 'Error interno: ' + error.message });
    }
});

// ==========================================
// 5. RUTAS ADMINISTRATIVAS Y DE ESTADÍSTICAS
// ==========================================

// CARGA MASIVA DE USUARIOS (Adaptado para Nombre, Grupo, Turno y Correo)
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

                // 1. Asignación de Defaults y Validaciones
                const nombreFinal = user.nombre ? user.nombre.toUpperCase().trim() : 'ASPIRANTE SIN NOMBRE';
                const rolFinal = user.rol ? user.rol.toLowerCase().trim() : 'alumno';
                
                // Si vienen vacíos, inyectamos los valores de control escolar por defecto
                let grupoFinal = (user.grupo && user.grupo.trim() !== '') ? user.grupo.toUpperCase().trim() : 'POR DEFINIR';
                let turnoFinal = (user.turno && user.turno.trim() !== '') ? user.turno.toUpperCase().trim() : 'MATUTINO';

                // Si es administrador, forzamos su grupo
                if (rolFinal === 'administrador') {
                    grupoFinal = 'ADMIN';
                }

                // 2. Creación del Modelo
                const nuevoUsuario = new Usuario({
                    idFirebase: crypto.randomUUID(), 
                    boleta: boletaNum,
                    curp: user.curp ? user.curp.toUpperCase().trim() : '',
                    nombre: nombreFinal,
                    correo: user.correo ? user.correo.trim().toLowerCase() : '',
                    grupo: grupoFinal,
                    turno: turnoFinal,
                    rol: rolFinal,
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



const normalizeString = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
};

function construirArbolJerarquico(statsPlanosSubtemas, materiaFiltro = null) {
    const todasLasClaves = { ...clavesSociales, ...clavesExactas, ...clavesExperimentales };
    const arbol = {};

    Object.values(todasLasClaves).forEach(reactivo => {
        const mat = reactivo.materia || "General";
        const tem = reactivo.tema || "General";
        const sub = reactivo.subtema || "General";

        // Filtro robusto usando el normalizador
        if (materiaFiltro && materiaFiltro !== 'TODAS' && normalizeString(mat) !== normalizeString(materiaFiltro)) return;

        if (!arbol[mat]) arbol[mat] = { aciertos: 0, total: 0, temas: {} };
        if (!arbol[mat].temas[tem]) arbol[mat].temas[tem] = { aciertos: 0, total: 0, subtemas: {} };
        if (!arbol[mat].temas[tem].subtemas[sub]) arbol[mat].temas[tem].subtemas[sub] = { aciertos: 0, total: 0 };
    });

    for (const [subtemaNombre, stats] of Object.entries(statsPlanosSubtemas)) {
        const reactivoRef = Object.values(todasLasClaves).find(r => r.subtema === subtemaNombre);
        if (reactivoRef) {
            const mat = reactivoRef.materia;
            const tem = reactivoRef.tema;
            
            // Filtro robusto usando el normalizador
            if (materiaFiltro && materiaFiltro !== 'TODAS' && normalizeString(mat) !== normalizeString(materiaFiltro)) continue;

            if(arbol[mat] && arbol[mat].temas[tem] && arbol[mat].temas[tem].subtemas[subtemaNombre]) {
                arbol[mat].temas[tem].subtemas[subtemaNombre].aciertos += stats.aciertos;
                arbol[mat].temas[tem].subtemas[subtemaNombre].total += stats.total;
                
                arbol[mat].temas[tem].aciertos += stats.aciertos;
                arbol[mat].temas[tem].total += stats.total;
                
                arbol[mat].aciertos += stats.aciertos;
                arbol[mat].total += stats.total;
            }
        }
    }
    return arbol;
}

// =======================================================
// 1. REPORTE ESTADÍSTICO GLOBAL (Con Árbol Jerárquico y Filtro Materia/Grupo)
// =======================================================
app.get('/api/examen/reporte-estadisticas', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, turno, materia, grupo } = req.query;
        const query = {};

        if (fechaInicio && fechaFin) {
            const start = new Date(fechaInicio); start.setHours(0, 0, 0, 0);
            const end = new Date(fechaFin); end.setHours(23, 59, 59, 999);
            query.fecha_intento = { $gte: start, $lte: end };
        }

        let usuariosFilter = { rol: 'alumno' };
        if (turno && turno !== 'TODOS') {
            usuariosFilter.turno = turno.toUpperCase().trim();
        }
        if (grupo) {
            usuariosFilter.grupo = grupo.toUpperCase().trim();
        }
        
        const usuariosValidos = await Usuario.find(usuariosFilter).select('_id');
        const usuariosIds = usuariosValidos.map(u => u._id.toString());

        if (Object.keys(usuariosFilter).length > 0) {
            query.usuario = { $in: usuariosIds };
        }

        const intentos = await ExamenIntento.find(query);

        let totalSociales = 0, totalExactas = 0, totalExperimentales = 0;
        let sumaSociales = 0, sumaExactas = 0, sumaExperimentales = 0;
        
        let materiasStats = {}; 
        let temasStats = {};
        let subtemasStats = {};
        let usuariosSet = new Set();
        let usuariosPorArea = { sociales: new Set(), exactas: new Set(), experimentales: new Set() };
        let examenesAnuladosPorTrampa = 0;

        intentos.forEach(intento => {
            const userIdStr = intento.usuario.toString();
            usuariosSet.add(userIdStr);
            const area = intento.area_examen;

            if (intento.examen_anulado) examenesAnuladosPorTrampa++;

            const calif = intento.calificacion_final;
            if (area === 'ciencias sociales') { totalSociales++; sumaSociales += calif; usuariosPorArea.sociales.add(userIdStr); }
            else if (area === 'ciencias exactas') { totalExactas++; sumaExactas += calif; usuariosPorArea.exactas.add(userIdStr); }
            else if (area === 'ciencias experimentales') { totalExperimentales++; sumaExperimentales += calif; usuariosPorArea.experimentales.add(userIdStr); }

            const acumular = (fuente, destino) => {
                if (!fuente) return;
                for (const [key, stats] of Object.entries(fuente)) {
                    if (!destino[key]) destino[key] = { aciertos: 0, total: 0 };
                    destino[key].aciertos += stats.aciertos;
                    destino[key].total += stats.total;
                }
            };

            acumular(intento.desglose_materias, materiasStats);
            acumular(intento.desglose_temas, temasStats);
            acumular(intento.desglose_subtemas, subtemasStats);
        });

        let alumnosCompletos = 0;
        usuariosSet.forEach(userId => {
            if (usuariosPorArea.sociales.has(userId) && usuariosPorArea.exactas.has(userId) && usuariosPorArea.experimentales.has(userId)) alumnosCompletos++;
        });

        // ==========================================
        // CREAMOS EL ÁRBOL FILTRADO
        // ==========================================
        const arbolEstructurado = construirArbolJerarquico(subtemasStats, materia);

        // ¡LA SOLUCIÓN AL BUG ESTÁ AQUÍ!
        // Reconstruimos los planos a partir del árbol para que las gráficas respeten el filtro.
        if (materia && materia !== 'TODAS') {
            materiasStats = {};
            temasStats = {};
            subtemasStats = {};

            for (const [mat, dataMat] of Object.entries(arbolEstructurado)) {
                if (dataMat.total > 0) materiasStats[mat] = { aciertos: dataMat.aciertos, total: dataMat.total };
                
                for (const [tem, dataTem] of Object.entries(dataMat.temas)) {
                    if (dataTem.total > 0) temasStats[tem] = { aciertos: dataTem.aciertos, total: dataTem.total };
                    
                    for (const [sub, dataSub] of Object.entries(dataTem.subtemas)) {
                        if (dataSub.total > 0) subtemasStats[sub] = { aciertos: dataSub.aciertos, total: dataSub.total };
                    }
                }
            }
        }

        const formatearStats = (obj) => Object.keys(obj).map(nombre => {
            const stats = obj[nombre];
            const porcentaje = stats.total > 0 ? ((stats.aciertos / stats.total) * 100) : 0;
            return { nombre, aciertos: stats.aciertos, total: stats.total, porcentaje: parseFloat(porcentaje.toFixed(2)) };
        }).sort((a, b) => a.porcentaje - b.porcentaje);

        res.status(200).json({
            rango: { fechaInicio, fechaFin },
            participacion: { 
                totalExamenes: intentos.length, 
                alumnosUnicos: usuariosSet.size, 
                alumnosCompletaronTodo: alumnosCompletos, 
                examenesAnuladosPorTrampa,
                porArea: { sociales: totalSociales, exactas: totalExactas, experimentales: totalExperimentales } 
            },
            promedios: { 
                sociales: totalSociales > 0 ? parseFloat((sumaSociales / totalSociales).toFixed(2)) : 0, 
                exactas: totalExactas > 0 ? parseFloat((sumaExactas / totalExactas).toFixed(2)) : 0, 
                experimentales: totalExperimentales > 0 ? parseFloat((sumaExperimentales / totalExperimentales).toFixed(2)) : 0 
            },
            rendimientoMaterias: formatearStats(materiasStats),
            rendimientoTemas: formatearStats(temasStats),
            rendimientoSubtemas: formatearStats(subtemasStats),
            arbolJerarquico: arbolEstructurado
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    }
});


// =======================================================
// 2. REPORTE INDIVIDUAL (Con Árbol Jerárquico para el Alumno)
// =======================================================
app.get('/api/examen/reporte-individual/:boleta', async (req, res) => {
    try {
        const boleta = Number(req.params.boleta);
        const usuario = await Usuario.findOne({ boleta: boleta }).populate('simuladorInduccion.examenesResueltos');

        if (!usuario) return res.status(404).json({ error: 'Alumno no encontrado en la base de datos.' });

        const examenes = usuario.simuladorInduccion.examenesResueltos || [];
        let resultadosPorArea = {
            sociales: { calificacion: 'Pendiente', anulado: false }, exactas: { calificacion: 'Pendiente', anulado: false }, experimentales: { calificacion: 'Pendiente', anulado: false }
        };
        
        let desgloseMaterias = {};
        let desgloseTemas = {};
        let desgloseSubtemas = {};

        examenes.forEach(ex => {
            let areaKey = '';
            if (ex.area_examen.includes('sociales')) areaKey = 'sociales';
            if (ex.area_examen.includes('exactas')) areaKey = 'exactas';
            if (ex.area_examen.includes('experimentales')) areaKey = 'experimentales';

            if (areaKey && (resultadosPorArea[areaKey].calificacion === 'Pendiente' || ex.calificacion_final > resultadosPorArea[areaKey].calificacion)) {
                resultadosPorArea[areaKey] = { calificacion: ex.calificacion_final, anulado: ex.examen_anulado };
            }

            const acumular = (fuente, destino) => {
                if (!fuente) return;
                for (const [key, stats] of Object.entries(fuente)) {
                    if (!destino[key]) destino[key] = { aciertos: 0, total: 0 };
                    destino[key].aciertos += stats.aciertos;
                    destino[key].total += stats.total;
                }
            };

            acumular(ex.desglose_materias, desgloseMaterias);
            acumular(ex.desglose_temas, desgloseTemas);
            acumular(ex.desglose_subtemas, desgloseSubtemas);
        });

        // ==========================================
        // CREAMOS EL ÁRBOL (Sin filtro de materia para el Alumno)
        // ==========================================
        const arbolEstructurado = construirArbolJerarquico(desgloseSubtemas);

        const formatearStats = (obj) => Object.keys(obj).map(nombre => {
            const stats = obj[nombre];
            const porcentaje = stats.total > 0 ? ((stats.aciertos / stats.total) * 100) : 0;
            return { nombre, aciertos: stats.aciertos, total: stats.total, porcentaje: parseFloat(porcentaje.toFixed(2)) };
        }).sort((a, b) => a.porcentaje - b.porcentaje);

        res.status(200).json({ 
            boleta: usuario.boleta, 
            curp: usuario.curp, 
            nombre: usuario.nombre, 
            grupo: usuario.grupo, 
            turno: usuario.turno,
            areas: resultadosPorArea, 
            materias: formatearStats(desgloseMaterias),
            temas: formatearStats(desgloseTemas),
            subtemas: formatearStats(desgloseSubtemas),
            arbolJerarquico: arbolEstructurado // ¡ÁRBOL INDIVIDUAL PARA SU ACUSE!
        }); 
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


// REPORTE PROFESOR (Incluye Faltantes, Turno y Nombre de Tramposos)
app.get('/api/examen/reporte-profesor', async (req, res) => {
    try {
        const { grupo, turno, fechaInicio, fechaFin } = req.query;
        
        let filtroUsuario = { rol: 'alumno' };
        if (grupo) filtroUsuario.grupo = grupo.toUpperCase().trim();
        if (turno && turno !== 'TODOS') filtroUsuario.turno = turno.toUpperCase().trim();

        const alumnos = await Usuario.find(filtroUsuario).populate('simuladorInduccion.examenesResueltos');

        let totalTramposos = 0;
        let listaTramposos = [];
        let listaFaltantes = [];
        let totalAlumnosConActividad = 0;

        let start = null, end = null;
        if (fechaInicio && fechaFin) {
            start = new Date(fechaInicio); start.setHours(0, 0, 0, 0);
            end = new Date(fechaFin); end.setHours(23, 59, 59, 999);
        }

        alumnos.forEach(alumno => {
            let hizoTrampa = false;
            let examenesConTrampa = [];
            let tuvoActividadEnPeriodo = false;

            // 1. REVISAR EXÁMENES FALTANTES
            let areasFaltantes = [];
            const si = alumno.simuladorInduccion;

            const stSoc = si.ciencias_sociales.estadoActual?.estado || 'no_iniciado';
            const stExa = si.ciencias_exactas.estadoActual?.estado || 'no_iniciado';
            const stExp = si.ciencias_experimentales.estadoActual?.estado || 'no_iniciado';

            if (stSoc !== 'finalizado') areasFaltantes.push('Ciencias Sociales');
            if (stExa !== 'finalizado') areasFaltantes.push('Ciencias Exactas');
            if (stExp !== 'finalizado') areasFaltantes.push('Cs. Experimentales');

            if (areasFaltantes.length > 0) {
                listaFaltantes.push({
                    nombre: alumno.nombre,
                    boleta: alumno.boleta,
                    grupo: alumno.grupo,
                    turno: alumno.turno,
                    faltan: areasFaltantes,
                    estados: {
                        sociales: stSoc,
                        exactas: stExa,
                        experimentales: stExp
                    }
                });
            }

            // 2. REVISAR ACTIVIDAD Y TRAMPAS
            alumno.simuladorInduccion.examenesResueltos.forEach(intento => {
                let dentroDeFecha = true;
                if (start && end && intento.fecha_intento) {
                    const fechaIntento = new Date(intento.fecha_intento);
                    if (fechaIntento < start || fechaIntento > end) dentroDeFecha = false;
                }

                if (dentroDeFecha) {
                    tuvoActividadEnPeriodo = true;
                    if (intento.examen_anulado) {
                        hizoTrampa = true;
                        examenesConTrampa.push(intento.area_examen);
                    }
                }
            });

            if (tuvoActividadEnPeriodo) totalAlumnosConActividad++;

            if (hizoTrampa) {
                totalTramposos++;
                listaTramposos.push({
                    nombre: alumno.nombre, // ¡Nombre incluido!
                    boleta: alumno.boleta,
                    correo: alumno.correo || alumno.curp,
                    grupo: alumno.grupo,
                    turno: alumno.turno,
                    examenesAnulados: examenesConTrampa
                });
            }
        });

        res.status(200).json({
            filtroGrupo: grupo || 'TODOS',
            filtroTurno: turno || 'TODOS',
            totalAlumnosConsultados: start ? totalAlumnosConActividad : alumnos.length, 
            totalTramposos,
            listaTramposos,
            totalFaltantes: listaFaltantes.length,
            listaFaltantes
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
