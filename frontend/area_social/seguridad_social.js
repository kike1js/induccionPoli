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

// Si ya había reprobado antes de recargar la página, lo bloqueamos.
if (examenCancelado) {
    forzarEnvioExamen();
}

// ==========================================
// 1. INICIAR PANTALLA COMPLETA
// Los navegadores exigen que el usuario dé un clic antes de entrar a fullscreen.
// Lo activamos en el primer clic que hagan en cualquier parte del examen.
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
// 3. SISTEMA DE CASTIGOS (UI PERSONALIZADA)
// ==========================================

// Reemplazamos alert() con un modal HTML para evitar el bug del ciclo infinito
function mostrarCastigoUI(nivel) {
    const mensaje = nivel === 1 
        ? "Has salido de la pantalla completa o dado clic en otra ventana (pérdida de foco). Te quedan 2 oportunidades."
        : "Último aviso. Si sales de la pantalla una vez más, tu examen será cancelado automáticamente.";

    const modal = document.createElement('div');
    modal.id = 'modal-seguridad';
    // Overlay oscuro que bloquea TODO el examen
    modal.className = "fixed inset-0 z-[100] bg-black bg-opacity-95 flex flex-col items-center justify-center p-4 text-center";
    
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl">
            <i class="fas fa-exclamation-triangle text-yellow-500 text-6xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Advertencia de Seguridad ${nivel}/3</h2>
            <p class="text-gray-600 mb-6 font-medium">${mensaje}</p>
            <button id="btn-reanudar" class="w-full px-6 py-3 bg-ipnGuinda text-white font-bold rounded-xl shadow-md hover:bg-ipnGuindaClaro transition">
                Entendido, volver a Pantalla Completa
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);

    // Obligamos al alumno a dar clic al botón para regresar a fullscreen
    document.getElementById('btn-reanudar').onclick = () => {
        document.documentElement.requestFullscreen().then(() => {
            modal.remove();
            // Damos medio segundo de respiro antes de volver a vigilar
            setTimeout(() => { bloqueoSistema = false; }, 500);
        }).catch(err => {
            // Si el navegador bloquea la acción, se lo pedimos de nuevo.
            alert("Debes permitir la pantalla completa para continuar el examen.");
        });
    };
}
// ==========================================
// 4. CONTROL EXTERNO DEL PERRO GUARDIÁN
// ==========================================
// Esta función permite al motor.js apagar la seguridad cuando el examen
// termina legalmente (por tiempo o por decisión del usuario).
function apagarSeguridad() {
    bloqueoSistema = true; 
    examenCancelado = true; // Engañamos al sistema para que ignore eventos
    console.log("Seguridad desactivada: El examen está en proceso de entrega legal.");
}

function forzarEnvioExamen() {
    bloqueoSistema = true;
    
    // Destruimos el contenido del examen y mostramos la pantalla de bloqueo
    document.body.innerHTML = `
        <div class="h-screen w-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center z-50 fixed inset-0">
            <i class="fas fa-ban text-red-600 text-7xl mb-4"></i>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Examen Cancelado Automáticamente</h1>
            <p class="text-gray-600 text-lg mb-8 max-w-lg">
                El sistema ha bloqueado tu acceso por infracción de seguridad (saliste de la pantalla completa o abriste ventanas de consulta repetidas veces). Tu calificación actual ha sido enviada.
            </p>
            <button onclick="window.location.href='../inicio.html'" class="px-8 py-3 bg-ipnGuinda text-white font-bold rounded-xl shadow-md hover:scale-105 transition">
                Volver al Menú Principal
            </button>
        </div>
    `;
    
    // Llamamos a la función global que empaqueta y envía los datos (declarada en motor_social.js)
    // Le damos un retraso de 2 segundos para que el alumno alcance a leer la pantalla de castigo
    setTimeout(() => {
        if (typeof finalizarExamen === "function") {
            finalizarExamen("trampa");
        }
    }, 2000);
}

// ==========================================
// MODO DESARROLLADOR: Limpiar memoria rápida
// ==========================================
document.addEventListener('keydown', (e) => {
    // Si presionas Ctrl + Alt + R
    if (e.ctrlKey && e.altKey && e.key === 'r') {
        localStorage.clear();
        alert("MODO DEV: Memoria limpiada. Reiniciando examen...");
        window.location.reload();
    }
});


