/**
 * ============================================================
 * GUARDIÁN POLIAPRENDE EXAMEN - CONEXIÓN A BACKEND DOCKER
 * Puerto: 3002
 * Validación invencible usando Boleta + Token
 * ============================================================
 */
(async function () {
    // AHORA USAMOS LA BOLETA COMO LLAVE MAESTRA
    const boletaActiva = localStorage.getItem("boleta_activa") || localStorage.getItem("poliBoleta");
    const sessionToken = localStorage.getItem("poliSessionToken");
    
    const currentPage = window.location.pathname;
    
    // Verificamos si estamos en la puerta de entrada (index, login, login_examen, etc)
    const isLoginPage = currentPage.endsWith("/") || currentPage.includes("index.html") || currentPage.includes("login");

    // Función auxiliar para redirigir al login
    const redirigirAlLogin = () => {
        const enSubcarpeta = currentPage.split('/').length > 2; 
        window.location.href = enSubcarpeta ? "../index.html" : "index.html";
    };

    if (boletaActiva && sessionToken) {
        try {
            // Petición de verificación basada en BOLETA
            const respuesta = await fetch('http://148.204.239.124:3002/api/examen/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boleta: boletaActiva, token: sessionToken })
            });

            const data = await respuesta.json();

            if (data.valida) {
                // TOKEN VÁLIDO: Si está en el login, pásalo a su área
                if (isLoginPage) {
                    const rol = localStorage.getItem("poliOcupacion");
                    if (rol === "administrador") {
                        window.location.href = "admin/inicio_admin.html";
                    } else {
                        window.location.href = "inicio.html";
                    }
                }

                // Asignar el botón de Cerrar Sesión si existe en la vista
                const logoutBtn = document.getElementById("logoutBtn");
                if (logoutBtn) {
                    logoutBtn.addEventListener("click", window.cerrarSesion);
                }
            } else {
                // TOKEN INVÁLIDO O SESIÓN APAGADA: Forzar expulsión
                throw new Error("Sesión inválida o expirada en el servidor.");
            }
        } catch (error) {
            console.warn("Seguridad (Expulsión):", error.message);
            localStorage.clear();
            if (!isLoginPage) {
                redirigirAlLogin();
            }
        }
    } else {
        // NO HAY DATOS LOCALES: Expulsar si no está en el login
        if (!isLoginPage) {
            redirigirAlLogin();
        }
    }

    // --- FUNCIÓN GLOBAL PARA CERRAR SESIÓN ---
    window.cerrarSesion = async function() {
        const boletaActual = localStorage.getItem("boleta_activa") || localStorage.getItem("poliBoleta");
        
        try {
            // SISTEMA ANTI-ABANDONO (TRAMPA DE CIERRE DE SESIÓN)
            const areas = ['sociales', 'exactas', 'experimentales'];
            let areaEnCurso = null;

            for (let area of areas) {
                if (localStorage.getItem(`tiempo_${area}`)) {
                    areaEnCurso = area;
                    break;
                }
            }

            if (areaEnCurso && boletaActual) {
                console.warn(`[Seguridad] Detectado intento de abandono en: ${areaEnCurso}. Castigando...`);
                await fetch('http://148.204.239.124:3002/api/examen/entregar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        boleta: boletaActual,
                        area_examen: `ciencias ${areaEnCurso}`,
                        examen_anulado: true, 
                        motivo_finalizacion: "abandono_por_cierre_sesion",
                        tiempo_restante_segundos: 0,
                        advertencias_cometidas: 3,
                        respuestas: JSON.parse(localStorage.getItem(`respuestas_${areaEnCurso}`) || '{}')
                    })
                });
            }

            // AVISAR AL BACKEND EL CIERRE SEGURO
            if (boletaActual) {
                await fetch('http://148.204.239.124:3002/api/examen/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ boleta: boletaActual })
                });
            }
        } catch (error) {
            console.error("Error al notificar cierre:", error);
        } finally {
            localStorage.clear();
            redirigirAlLogin();
        }
    };
})();