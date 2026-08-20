/**
 * ============================================================
 * ARCHIVO: seguridad_social.js
 * PROPÓSITO: Seguridad Anti-Trampas (Pantalla Completa, Foco de Ventana, Pestañas)
 * ============================================================
 */

let advertenciasSeguridad = parseInt(localStorage.getItem('advertencias_sociales')) || 0;
const MAX_ADVERTENCIAS = 3;
const domContadorAdv = document.getElementById('contador-advertencias');

// Bandera vital para evitar doble conteo por eventos simultáneos
let bloqueoSistema = false; 
let examenCancelado = advertenciasSeguridad >= MAX_ADVERTENCIAS;

domContadorAdv.innerText = advertenciasSeguridad;

// Si ya había reprobado antes de recargar la página, lo bloqueamos de inmediato.
if (examenCancelado) {
    forzarEnvioExamen();
}

// ==========================================
// 1. INICIAR PANTALLA COMPLETA
// ==========================================
document.body.addEventListener('click', solicitarPantallaCompleta, { once: true });

function solicitarPantallaCompleta() {
    if (!document.fullscreenElement && !examenCancelado) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn("Esperando interacción del usuario para pantalla completa...");
        });
    }
}

// ==========================================
// 2. DETECCIÓN DE INFRACCIONES
// ==========================================

function registrarInfraccion() {
    if (bloqueoSistema || examenCancelado) return; // Si ya estamos mostrando una advertencia, ignoramos.

    bloqueoSistema = true; // Bloqueamos los eventos temporales
    advertenciasSeguridad++;
    localStorage.setItem('advertencias_sociales', advertenciasSeguridad);
    domContadorAdv.innerText = advertenciasSeguridad;

    if (advertenciasSeguridad >= MAX_ADVERTENCIAS) {
        examenCancelado = true;
        forzarEnvioExamen();
    } else {
        mostrarCastigoUI(advertenciasSeguridad);
    }
}

// A. Cambian de pestaña o minimizan todo el navegador
document.addEventListener("visibilitychange", () => {
    if (document.hidden) registrarInfraccion();
});

// B. Tienen dos ventanas lado a lado y dan clic en la ventana de "Google" (Pierden el Foco)
window.addEventListener("blur", () => {
    registrarInfraccion();
});

// C. Presionan ESC o el botón de salir de pantalla completa
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && !bloqueoSistema) {
        registrarInfraccion();
    }
});


// ==========================================
// NUEVO: BLOQUEO ESTRICTO DE TECLADO
// ==========================================
// Esta función anula cualquier pulsación de tecla mientras el castigo está activo.
function prevenirTeclado(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

// ==========================================
// 3. SISTEMA DE CASTIGOS (UI PERSONALIZADA)
// ==========================================

function mostrarCastigoUI(nivel) {
    const mensaje = nivel === 1 
        ? "Has salido de la pantalla completa o dado clic en otra ventana (pérdida de foco). Te quedan 2 oportunidades."
        : "Último aviso. Si sales de la pantalla una vez más, tu examen será cancelado automáticamente.";

    const modal = document.createElement('div');
    modal.id = 'modal-seguridad';
    modal.className = "fixed inset-0 z-[100] bg-black bg-opacity-95 flex flex-col items-center justify-center p-4 text-center";
    
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <i class="fas fa-exclamation-triangle text-yellow-500 text-6xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Advertencia de Seguridad ${nivel}/3</h2>
            <p class="text-gray-600 mb-6 font-medium">${mensaje}</p>
            <p class="text-xs text-red-500 mb-4 font-bold uppercase"><i class="fas fa-keyboard"></i> Teclado bloqueado temporalmente</p>
            <button id="btn-reanudar" class="w-full px-6 py-3 bg-ipnGuinda text-white font-bold rounded-xl shadow-md hover:bg-ipnGuindaClaro transition">
                Entendido, volver a Pantalla Completa
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);

    // Activamos el bloqueo absoluto de teclado
    document.addEventListener('keydown', prevenirTeclado, { capture: true });

    document.getElementById('btn-reanudar').onclick = () => {
        document.documentElement.requestFullscreen().then(() => {
            modal.remove();
            // Liberamos el teclado
            document.removeEventListener('keydown', prevenirTeclado, { capture: true });
            
            setTimeout(() => { bloqueoSistema = false; }, 500);
        }).catch(err => {
            alert("Debes permitir la pantalla completa para continuar el examen.");
        });
    };
}

// ==========================================
// 4. CONTROL EXTERNO DEL PERRO GUARDIÁN
// ==========================================
function apagarSeguridad() {
    bloqueoSistema = true; 
    examenCancelado = true; 
    console.log("Seguridad desactivada: El examen está en proceso de entrega legal.");
}

function forzarEnvioExamen() {
    bloqueoSistema = true;
    
    // 1. Forzamos pantalla completa si se salieron
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log("No se pudo forzar fullscreen en castigo"));
    }

    // 2. Bloqueamos teclado y ratón de fondo
    document.addEventListener('keydown', prevenirTeclado, { capture: true });
    
    // 3. UI Ineludible (Sin botón de regresar)
    // El pointer-events-none en el div principal evita que den clics rápidos a otras cosas que pudieran existir
    document.body.innerHTML = `
        <div class="h-screen w-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center z-[9999] fixed inset-0 pointer-events-none select-none">
            <i class="fas fa-ban text-red-600 text-7xl mb-4 animate-pulse"></i>
            <h1 class="text-3xl md:text-4xl font-black text-gray-800 mb-2 uppercase">Examen Cancelado</h1>
            <p class="text-gray-600 text-lg mb-8 max-w-lg font-medium">
                El sistema ha bloqueado tu acceso por infracciones de seguridad.<br>
                Enviando resultados al servidor...
            </p>
            
            <div class="flex items-center justify-center space-x-2 text-ipnGuinda font-bold text-xl">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Procesando envío obligatorio...</span>
            </div>
        </div>
    `;
    
    // 4. Ejecutamos el envío final.
    // Una vez que 'finalizarExamen' en motor_social.js termine de enviarse al backend
    // y reciba el OK, ESE archivo es el responsable de redirigir a 'inicio.html'.
    setTimeout(() => {
        if (typeof finalizarExamen === "function") {
            // Pasamos 'trampa' para que el motor sepa por qué se canceló
            finalizarExamen("trampa");
        } else {
            // Fallback de seguridad extrema: Si motor_social.js no cargó o falló
            console.error("Motor de examen no encontrado. Forzando salida.");
            window.location.href = "../inicio.html";
        }
    }, 1500); // 1.5 segundos para que vean el mensaje de castigo
}

// ==========================================
// MODO DESARROLLADOR: Limpiar memoria rápida
// ==========================================
document.addEventListener('keydown', (e) => {
    // Excepción para el modo desarrollador: Solo funciona si NO está bloqueado el teclado
    if (e.ctrlKey && e.altKey && e.key === 'r') {
        localStorage.clear();
        alert("MODO DEV: Memoria limpiada. Reiniciando examen...");
        window.location.reload();
    }
});