/**
 * ============================================================
 * LOGIN EXAMEN POLIAPRENDE (VERSIÓN UNIFICADA)
 * Método: Boleta (Usuario) + CURP (Contraseña)
 * Puerto: 3002 
 * Funcionalidad: Soporte para Modo Administrador y Alumno
 * ============================================================
 */
document.getElementById("loginBtn").addEventListener("click", async () => {
    const boletaInput = document.getElementById("boleta"); 
    const curpInput = document.getElementById("password");
    const message = document.getElementById("message");
    const loginBtn = document.getElementById("loginBtn");

    const boletaStr = boletaInput.value.trim().toUpperCase();
    const curp = curpInput.value.trim().toUpperCase();

    // Resetear UI
    message.className = "";
    message.style.display = "none";

    if (!boletaStr || !curp) {
        message.innerHTML = '<i class="fas fa-exclamation-circle"></i> Por favor, ingresa tu Boleta y CURP.';
        message.className = "msg-error";
        message.style.display = "block";
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        message.textContent = "Conectando con el servidor...";
        message.className = "msg-info";
        message.style.display = "block";

        // ==========================================
        // PETICIÓN AL BACKEND (PUERTO 3002)
        // ==========================================
        const respuesta = await fetch('http://bitacoras.cecyt14.ipn.mx/api/examen/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boleta: boletaStr, curp: curp })
        });
        
        const data = await respuesta.json();
        
        if (!respuesta.ok) {
            throw new Error(data.error || "Credenciales incorrectas.");
        }

        // ==========================================
        // ÉXITO: GUARDAMOS VARIABLES EN LOCALSTORAGE
        // Combinamos las necesidades del Repositorio y del Examen
        // ==========================================
        
        // Variables generales de la plataforma PoliAprende
        localStorage.setItem("poliBoleta", data.usuario.boleta);
        localStorage.setItem("poliNombre", data.usuario.nombre || "Usuario");
        localStorage.setItem("poliOcupacion", data.usuario.rol);
        if(data.usuario.idFirebase) localStorage.setItem("poliUserKey", data.usuario.idFirebase); 
        
        // Variables específicas de seguridad del motor de Exámenes
        localStorage.setItem("boleta_activa", data.usuario.boleta);
        if(data.token) localStorage.setItem("poliSessionToken", data.token);
        
        // Limpiamos CUALQUIER rastro de exámenes anteriores para evitar bugs o trampas
        const areasExamen = ['sociales', 'exactas', 'experimentales'];
        areasExamen.forEach(area => {
            localStorage.removeItem(`respuestas_${area}`);
            localStorage.removeItem(`tiempo_${area}`);
            localStorage.removeItem(`advertencias_${area}`);
            localStorage.removeItem(`marcadas_${area}`);
            localStorage.removeItem(`indice_${area}`);
        });

        // Mensaje de éxito
        message.innerHTML = `<i class="fas fa-check-circle"></i> ¡Acceso Concedido!`; 
        message.className = "msg-success";

        // ==========================================
        // REDIRECCIÓN BASADA EN EL ROL DEL MODELO
        // ==========================================
        setTimeout(() => {
            if (data.usuario.rol === 'administrador') {
                // CORRECCIÓN: Quitamos la subcarpeta "admin/"
                window.location.href = "admin/inicio_admin.html"; 
            } else if (data.usuario.rol === 'alumno'){
                // Si es alumno (por defecto), lo mandamos al inicio del simulador
                window.location.href = "inicio.html"; 
            }
        }, 1500);

    } catch (error) {
        console.error("Error en Login:", error);
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'INGRESAR A LA PLATAFORMA';
        message.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message}`;
        message.className = "msg-error";
        message.style.display = "block";
    }
});

// Soporte para iniciar sesión presionando la tecla "Enter"
document.getElementById("password").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        document.getElementById("loginBtn").click();
    }
});