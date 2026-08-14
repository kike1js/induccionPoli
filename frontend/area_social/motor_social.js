/**
 * ============================================================
 * ARCHIVO: motor_social.js
 * PROPÓSITO: Lógica principal (Navegación, Renderizado, Guardado)
 * ============================================================
 */

// ==========================================
// FUNCIÓN ROBUSTA PARA LEER MEMORIA (BLINDADA)
// ==========================================
function safeParse(key) {
    try {
        const val = localStorage.getItem(key);
        // Filtramos agresivamente cualquier valor corrupto o nulo
        if (!val || val === "null" || val === "undefined") {
            return {};
        }
        const parsed = JSON.parse(val);
        // Validamos que el resultado sea realmente un objeto útil y no un null tramposo
        return (parsed !== null && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
        console.warn(`Error leyendo ${key} del localStorage. Iniciando con objeto vacío.`);
        return {};
    }
}

// Inicialización ultra segura
let indiceActual = parseInt(localStorage.getItem('indice_sociales'));
if (isNaN(indiceActual) || indiceActual < 0) {
    indiceActual = 0;
}

let respuestasGuardadas = safeParse('respuestas_sociales');
let preguntasMarcadas = safeParse('marcadas_sociales');
let tiempoRestante = parseInt(localStorage.getItem('tiempo_sociales')) || 3600; 

// Debugging: Verificar qué cargó la memoria al arrancar
console.log("📥 Memoria Restaurada -> Respuestas:", respuestasGuardadas);
console.log("📥 Memoria Restaurada -> Marcadas:", preguntasMarcadas);
console.log("📥 Memoria Restaurada -> Tiempo:", tiempoRestante);
console.log("📥 Memoria Restaurada -> Índice:", indiceActual);

const DOM = {
    etiquetaMateria: document.getElementById('etiqueta-materia'),
    contadorContestadas: document.getElementById('contador-contestadas'), 
    totalPreguntas: document.getElementById('total-preguntas'),
    textoPregunta: document.getElementById('texto-pregunta'),
    contenedorOpciones: document.getElementById('contenedor-opciones'),
    panelLectura: document.getElementById('panel-lectura'),
    textoLectura: document.getElementById('texto-lectura-contenedor'),
    fabLectura: document.getElementById('fab-lectura'),
    panelMapa: document.getElementById('panel-mapa'), 
    contenedorImagen: document.getElementById('contenedor-imagen'),
    imagenPregunta: document.getElementById('imagen-pregunta'),
    cuadriculaMapa: document.getElementById('cuadricula-mapa'),
    relojGlobal: document.getElementById('reloj-global'),
    btnAnterior: document.getElementById('btn-anterior'),
    btnSiguiente: document.getElementById('btn-siguiente'),
    btnRevisar: document.getElementById('btn-revisar'),
    btnGuardarProgreso: document.getElementById('btn-guardar-progreso'), // Botón Manual
    btnFinalizar: document.getElementById('btn-finalizar')
};

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Verificación Crítica: ¿Existe el archivo de reactivos?
    if (typeof reactivosSociales === 'undefined' || !reactivosSociales || reactivosSociales.length === 0) {
        console.error("CRÍTICO: No se pudo cargar el arreglo reactivosSociales.");
        document.body.innerHTML = "<div style='display:flex; justify-content:center; align-items:center; height:100vh;'><h1 style='color:red; text-align:center; padding:20px; border:2px solid red; background:#ffe6e6; border-radius:10px;'>Error Crítico: No se encontró el archivo de reactivos. <br><br> Avisa a tu profesor.</h1></div>";
        return;
    }

    // 2. Verificación de Límite (Por si el alumno probó con 40 preguntas y luego bajaste a 10)
    if (indiceActual >= reactivosSociales.length) {
        console.warn(`Índice guardado (${indiceActual}) es mayor a la cantidad de preguntas (${reactivosSociales.length}). Regresando a la 1.`);
        indiceActual = 0;
    }

    iniciarReloj();
    generarMapaReactivos();
    renderizarPregunta(indiceActual); 
    configurarBotonesNavegacion();
    aplicarTrampaScroll(); 
    actualizarContadorProgreso();
});

// ==========================================
// FUNCIONES: MÓVIL (TRAMPA SCROLL)
// ==========================================

function aplicarTrampaScroll() {
    if (DOM.textoLectura && DOM.textoLectura.classList.contains('overflow-y-auto')) {
        DOM.textoLectura.classList.replace('overflow-y-auto', 'overflow-y-scroll');
    }
    if (DOM.textoPregunta) {
        const seccionPregunta = DOM.textoPregunta.closest('section');
        if(seccionPregunta && seccionPregunta.classList.contains('overflow-y-auto')) {
            seccionPregunta.classList.replace('overflow-y-auto', 'overflow-y-scroll');
        }
    }
}

function renderizarPregunta(indice) {
    const reactivo = reactivosSociales[indice];
    if (!reactivo) return;

    localStorage.setItem('indice_sociales', indice);

    if (DOM.etiquetaMateria) DOM.etiquetaMateria.innerText = reactivo.materia || "Materia Indefinida";
    if (DOM.textoPregunta) DOM.textoPregunta.innerText = `${indice + 1}. ${reactivo.pregunta}`;

    if (reactivo.requiere_lectura && DOM.textoLectura) {
        DOM.textoLectura.innerHTML = reactivo.texto_lectura;
        DOM.panelLectura.classList.remove('hidden');
        DOM.fabLectura.classList.remove('hidden');
    } else if (DOM.textoLectura) {
        DOM.textoLectura.innerHTML = ''; 
        DOM.panelLectura.classList.add('hidden');
        DOM.fabLectura.classList.add('hidden');
    }

    if (window.innerWidth < 1024 && DOM.panelLectura && DOM.panelMapa) {
        DOM.panelLectura.classList.add('-translate-x-full');
        DOM.panelMapa.classList.add('translate-x-full');
    }

    if (reactivo.imagen_pregunta && DOM.imagenPregunta) {
        DOM.imagenPregunta.src = reactivo.imagen_pregunta;
        DOM.contenedorImagen.classList.remove('hidden');
    } else if (DOM.contenedorImagen) {
        DOM.contenedorImagen.classList.add('hidden');
        DOM.imagenPregunta.src = '';
    }

    if (DOM.contenedorOpciones) {
        DOM.contenedorOpciones.innerHTML = '';
        
        // Blindaje por si al reactivo le faltan las opciones
        if (reactivo.opciones && Array.isArray(reactivo.opciones)) {
            reactivo.opciones.forEach(opcion => {
                const btn = document.createElement('button');
                btn.className = `opcion-btn flex items-center p-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition text-left group w-full`;
                
                const estaSeleccionada = respuestasGuardadas[indice] === opcion.letra;
                if (estaSeleccionada) {
                    btn.classList.add('opcion-seleccionada');
                }

                btn.innerHTML = `
                    <div class="w-8 h-8 shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center font-bold text-gray-500 mr-3 transition group-hover:border-ipnGuinda group-hover:text-ipnGuinda ${estaSeleccionada ? 'bg-ipnGuinda text-white border-ipnGuinda' : ''}">
                        ${opcion.letra}
                    </div>
                    <span class="text-gray-700 font-medium">${opcion.texto}</span>
                `;

                btn.onclick = () => guardarRespuesta(indice, opcion.letra);
                DOM.contenedorOpciones.appendChild(btn);
            });
        }
    }

    actualizarInterfazNavegacion();
    actualizarMapaColores();
}

function guardarRespuesta(indice, letra) {
    respuestasGuardadas[indice] = letra;
    localStorage.setItem('respuestas_sociales', JSON.stringify(respuestasGuardadas));
    
    if (preguntasMarcadas[indice]) {
        delete preguntasMarcadas[indice];
        localStorage.setItem('marcadas_sociales', JSON.stringify(preguntasMarcadas));
    }
    
    renderizarPregunta(indice);
    actualizarContadorProgreso();
    
    // Forzamos un autoguardado en DB cada que el usuario responde
    if (typeof autoGuardarEnServidor === "function") {
        autoGuardarEnServidor();
    }
}

function actualizarContadorProgreso() {
    if (!DOM.contadorContestadas || !DOM.totalPreguntas) return;
    
    // Contamos cuántas llaves tiene el objeto de respuestas (preguntas contestadas)
    const contestadas = Object.keys(respuestasGuardadas).length;
    const totales = reactivosSociales.length;
    
    DOM.contadorContestadas.innerText = contestadas;
    DOM.totalPreguntas.innerText = totales;
    
    // Extra visual: Si ya contestó todo, el contador se pone verde para indicarle que está listo
    if (contestadas === totales && totales > 0) {
        const contenedor = DOM.contadorContestadas.closest('div');
        contenedor.classList.replace('text-blue-600', 'text-green-600');
        contenedor.classList.replace('bg-blue-50', 'bg-green-50');
        contenedor.classList.replace('border-blue-200', 'border-green-200');
    }
}

function generarMapaReactivos() {
    if (!DOM.cuadriculaMapa) return;
    DOM.cuadriculaMapa.innerHTML = '';
    reactivosSociales.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.id = `btn-mapa-${i}`;
        btn.innerText = i + 1;
        btn.onclick = () => {
            indiceActual = i;
            renderizarPregunta(indiceActual);
        };
        DOM.cuadriculaMapa.appendChild(btn);
    });
}

function actualizarMapaColores() {
    reactivosSociales.forEach((_, i) => {
        const btn = document.getElementById(`btn-mapa-${i}`);
        if(!btn) return;
        
        btn.className = 'w-10 h-10 rounded-md font-bold text-sm flex items-center justify-center transition shadow-sm border-2 ';
        
        if (i === indiceActual) {
            btn.classList.add('border-blue-500', 'text-blue-700');
        } else {
            btn.classList.add('border-transparent');
        }

        if (preguntasMarcadas[i]) {
            btn.classList.add('bg-ipnAmarillo', 'text-white'); 
        } else if (respuestasGuardadas[i]) {
            btn.classList.add('bg-ipnGuinda', 'text-white'); 
        } else {
            btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200'); 
        }
    });

    if (DOM.btnRevisar) {
        if (preguntasMarcadas[indiceActual]) {
            DOM.btnRevisar.innerHTML = `<i class="fas fa-check mr-2"></i> Quitar Marca`;
            DOM.btnRevisar.classList.replace('bg-yellow-100', 'bg-gray-200');
            DOM.btnRevisar.classList.replace('text-yellow-700', 'text-gray-700');
        } else {
            DOM.btnRevisar.innerHTML = `<i class="fas fa-flag mr-2"></i> Marcar`;
            DOM.btnRevisar.classList.replace('bg-gray-200', 'bg-yellow-100');
            DOM.btnRevisar.classList.replace('text-gray-700', 'text-yellow-700');
        }
    }
}

function configurarBotonesNavegacion() {
    if (DOM.btnAnterior) {
        DOM.btnAnterior.onclick = () => {
            if (indiceActual > 0) {
                indiceActual--;
                renderizarPregunta(indiceActual);
            }
        };
    }

    if (DOM.btnSiguiente) {
        DOM.btnSiguiente.onclick = () => {
            if (indiceActual < reactivosSociales.length - 1) {
                indiceActual++;
                renderizarPregunta(indiceActual);
            }
        };
    }

    if (DOM.btnRevisar) {
        DOM.btnRevisar.onclick = () => {
            if (preguntasMarcadas[indiceActual]) {
                delete preguntasMarcadas[indiceActual];
            } else {
                preguntasMarcadas[indiceActual] = true;
            }
            localStorage.setItem('marcadas_sociales', JSON.stringify(preguntasMarcadas));
            actualizarMapaColores();
            
            // Autoguardamos también al marcar/desmarcar
            if (typeof autoGuardarEnServidor === "function") {
                autoGuardarEnServidor();
            }
        };
    }

    // BOTÓN DE GUARDADO MANUAL (Nuevo)
    if (DOM.btnGuardarProgreso) {
        DOM.btnGuardarProgreso.onclick = async () => {
            const btnOriginalHTML = DOM.btnGuardarProgreso.innerHTML;
            DOM.btnGuardarProgreso.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            DOM.btnGuardarProgreso.disabled = true;
            
            await autoGuardarEnServidor();
            
            DOM.btnGuardarProgreso.innerHTML = '<i class="fas fa-check"></i> ¡Guardado Exitosamente!';
            DOM.btnGuardarProgreso.classList.replace('bg-blue-100', 'bg-green-100');
            DOM.btnGuardarProgreso.classList.replace('text-blue-800', 'text-green-800');
            
            setTimeout(() => {
                DOM.btnGuardarProgreso.innerHTML = btnOriginalHTML;
                DOM.btnGuardarProgreso.disabled = false;
                DOM.btnGuardarProgreso.classList.replace('bg-green-100', 'bg-blue-100');
                DOM.btnGuardarProgreso.classList.replace('text-green-800', 'text-blue-800');
            }, 2500);
        };
    }

    if (DOM.btnFinalizar) {
        DOM.btnFinalizar.onclick = () => {
            const confirmacion = confirm("¿Estás seguro de que deseas terminar tu examen? Ya no podrás cambiar tus respuestas.");
            if (confirmacion) {
                if (typeof apagarSeguridad === "function") {
                    apagarSeguridad();
                }
                finalizarExamen("terminado_por_usuario");
            }
        };
    }
}

function actualizarInterfazNavegacion() {
    if (DOM.btnAnterior) {
        DOM.btnAnterior.disabled = indiceActual === 0;
        DOM.btnAnterior.style.opacity = indiceActual === 0 ? "0.5" : "1";
    }

    if (DOM.btnSiguiente) {
        DOM.btnSiguiente.disabled = indiceActual === reactivosSociales.length - 1;
        DOM.btnSiguiente.style.opacity = indiceActual === reactivosSociales.length - 1 ? "0.5" : "1";
    }
}

// ==========================================
// RELOJ GLOBAL Y ENTREGA AUTOMÁTICA (CON JITTER ANTI-COLAPSO)
// ==========================================
function iniciarReloj() {
    const intervalo = setInterval(() => {
        if (tiempoRestante <= 0) {
            clearInterval(intervalo);
            
            // 1. Apagamos el perro guardián para que no detecte el alert o la espera como trampa
            if (typeof apagarSeguridad === "function") {
                apagarSeguridad();
            }

            // 2. Avisamos al usuario para que deje de interactuar
            alert("El tiempo ha terminado. Tu examen se enviará automáticamente. Por favor, no cierres esta ventana.");
            
            // 3. TÉCNICA JITTER: Generamos un retraso aleatorio entre 0 y 8000 milisegundos (0 a 8 segundos)
            // Esto dispersa las miles de peticiones simultáneas, dándole respiro a Node.js y MongoDB.
            const retrasoAleatorio = Math.floor(Math.random() * 8000);
            console.log(`Tiempo agotado. Aplicando Jitter de ${retrasoAleatorio}ms para estabilizar la red...`);
            
            // 4. Enviamos el examen después del retraso aleatorio
            setTimeout(() => {
                finalizarExamen("tiempo_agotado");
            }, retrasoAleatorio);
            
            return;
        }
        
        tiempoRestante--;
        // IMPORTANTE: cambiar 'tiempo_sociales' a 'tiempo_exacto' o 'tiempo_experimental' en sus respectivos motores.
        localStorage.setItem('tiempo_sociales', tiempoRestante); 

        // AUTO-GUARDADO CADA 15 SEGUNDOS (Silencioso)
        // El autoguardado NO necesita Jitter porque los alumnos inician el examen en momentos ligeramente distintos,
        // por lo que estos 15 segundos ya están dispersos de forma natural.
        if (tiempoRestante > 0 && tiempoRestante % 15 === 0) {
            if (typeof autoGuardarEnServidor === "function") {
                autoGuardarEnServidor();
            }
        }
        
        // Renderizado del reloj en formato HH:MM:SS
        const horas = Math.floor(tiempoRestante / 3600);
        const minutos = Math.floor((tiempoRestante % 3600) / 60);
        const segundos = tiempoRestante % 60;
        
        if (DOM.relojGlobal) {
            DOM.relojGlobal.innerText = 
                `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
                
            // Alerta visual en los últimos 5 minutos (300 segundos)
            if(tiempoRestante < 300) { 
                DOM.relojGlobal.classList.add('text-red-600', 'animate-pulse');
            }
        }
    }, 1000);

    // =====================================================================
    // CASO EXTREMO: El alumno entra a la página y el tiempo ya era 0
    // =====================================================================
    if (tiempoRestante <= 0) {
        clearInterval(intervalo);
        
        if (typeof apagarSeguridad === "function") {
            apagarSeguridad();
        }
        
        alert("El tiempo ha terminado. Tu examen se enviará automáticamente. Por favor, no cierres esta ventana.");
        
        // También aplicamos el Jitter aquí por máxima seguridad
        const retrasoAleatorio = Math.floor(Math.random() * 8000);
        console.log(`Carga con tiempo 0. Aplicando Jitter de ${retrasoAleatorio}ms...`);
        
        setTimeout(() => {
            finalizarExamen("tiempo_agotado");
        }, retrasoAleatorio);
    }
}

// ==========================================
// SISTEMA DE AUTO-GUARDADO Y FINALIZACIÓN
// ==========================================
async function autoGuardarEnServidor() {
    const boletaActiva = localStorage.getItem("boleta_activa");
    if (!boletaActiva) return; 

    const payload = {
        boleta: boletaActiva,
        area: "ciencias sociales", 
        estado: "en_curso",
        tiempoRestante: tiempoRestante,
        advertencias: parseInt(localStorage.getItem('advertencias_sociales')) || 0,
        respuestas: respuestasGuardadas,
        marcadas: preguntasMarcadas,
        indice: indiceActual
    };

    try {
        await fetch('http://bitacoras.cecyt14.ipn.mx/api/examen/autoguardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log(`☁️ [Sociales] Auto-Guardado en la nube (${tiempoRestante}s).`);
    } catch (error) {
        console.warn("Autoguardado falló temporalmente (Reintentará).");
    }
}

async function finalizarExamen(motivo = "terminado_por_usuario") {
    const boletaUsuario = localStorage.getItem('boleta_activa') || "2025630152"; 
    const tiempoSobrante = parseInt(localStorage.getItem('tiempo_sociales')) || 0;
    const advertencias = parseInt(localStorage.getItem('advertencias_sociales')) || 0;
    const esTrampa = motivo === "trampa";

    const payload = {
        boleta: boletaUsuario,
        area_examen: "ciencias sociales", 
        motivo_finalizacion: motivo,
        respuestas: respuestasGuardadas, // Usamos la variable de memoria directa
        tiempo_restante_segundos: tiempoSobrante,
        advertencias_cometidas: advertencias,
        examen_anulado: esTrampa
    };

    console.log("Enviando paquete definitivo al Backend:", payload);

    try {
        const response = await fetch('http://bitacoras.cecyt14.ipn.mx/api/examen/entregar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Error al procesar el examen");
        }

        // Limpieza profunda local
        localStorage.removeItem('respuestas_sociales');
        localStorage.removeItem('tiempo_sociales');
        localStorage.removeItem('advertencias_sociales');
        localStorage.removeItem('marcadas_sociales');
        localStorage.removeItem('indice_sociales');

        localStorage.setItem('ultimo_resultado_examen', JSON.stringify(data));
        window.location.href = "../resultados.html";

    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Hubo un error al enviar tu examen al servidor. Por favor avisa a tu profesor y no cierres esta ventana.");
    }
}