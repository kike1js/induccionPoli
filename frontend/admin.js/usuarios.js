document.addEventListener('DOMContentLoaded', () => {
    
    let usuariosPendientes = []; 
    
    // Referencias al DOM
    const formManual = document.getElementById('formManual');
    const csvFileInput = document.getElementById('csvFileInput');
    const btnProcesarCSV = document.getElementById('btnProcesarCSV');
    const tablaUsuarios = document.getElementById('tablaUsuarios');
    const filaVacia = document.getElementById('filaVacia');
    const badgeContador = document.getElementById('badgeContador');
    const btnGuardarBaseDatos = document.getElementById('btnGuardarBaseDatos');
    const toastContainer = document.getElementById('toastContainer');

// 1. ALTA MANUAL
    formManual.addEventListener('submit', (e) => {
        e.preventDefault();
        const boleta = document.getElementById('inputBoleta').value.trim();
        const curp = document.getElementById('inputCurp').value.trim().toUpperCase();
        const correo = document.getElementById('inputCorreo').value.trim().toLowerCase();
        let grupo = document.getElementById('inputGrupo').value.trim().toUpperCase();
        const rol = document.getElementById('selectRol').value;

        // Lógica de fuerza para Administradores
        if (rol === 'administrador') {
            grupo = 'ADMIN';
        } else if (grupo === '') {
            grupo = 'SIN GRUPO';
        }

        if(boleta.length < 8) {
            mostrarToast('La boleta/pre-boleta suele tener al menos 8 dígitos', 'error');
            return;
        }
        if(curp.length !== 18) {
            mostrarToast('La CURP debe tener exactamente 18 caracteres', 'error');
            return;
        }
        if (usuariosPendientes.some(u => u.boleta === boleta)) {
            mostrarToast('Esta boleta ya está en la lista pendiente', 'error');
            return;
        }

        usuariosPendientes.push({ boleta, curp, correo, grupo, rol });
        
        // Limpiar inputs
        document.getElementById('inputBoleta').value = '';
        document.getElementById('inputCurp').value = '';
        document.getElementById('inputCorreo').value = '';
        document.getElementById('inputGrupo').value = '';
        
        actualizarTabla();
        mostrarToast('Usuario agregado a la lista local', 'success');
    });

    // Pequeña mejora UX: Si seleccionan "Administrador", deshabilitar el input de Grupo
    document.getElementById('selectRol').addEventListener('change', (e) => {
        const inputGrupo = document.getElementById('inputGrupo');
        if (e.target.value === 'administrador') {
            inputGrupo.value = 'ADMIN';
            inputGrupo.disabled = true;
            inputGrupo.classList.add('bg-gray-200');
        } else {
            inputGrupo.value = '';
            inputGrupo.disabled = false;
            inputGrupo.classList.remove('bg-gray-200');
        }
    });

    // 2. CARGA MASIVA (CSV)
    btnProcesarCSV.addEventListener('click', () => {
        const file = csvFileInput.files[0];
        if (!file) {
            mostrarToast('Por favor, selecciona un archivo CSV primero', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const lines = text.split('\n');
            let agregados = 0;

            lines.forEach((line) => {
                if (!line.trim()) return; 

                const parts = line.split(',');
                if (parts.length >= 2) {
                    const boleta = parts[0].trim();
                    const curp = parts[1].trim().toUpperCase();
                    const correo = parts[2] ? parts[2].trim().toLowerCase() : '';
                    let grupo = parts[3] ? parts[3].trim().toUpperCase() : 'SIN GRUPO';
                    const rol = (parts[4] && parts[4].trim() !== '') ? parts[4].trim().toLowerCase() : 'alumno';

                    if (rol === 'administrador') grupo = 'ADMIN';

                    // Evitar meter basura o cabeceras
                    if(boleta.toLowerCase() !== 'boleta' && !isNaN(boleta) && curp.length === 18) {
                        if (!usuariosPendientes.some(u => u.boleta === boleta)) {
                            usuariosPendientes.push({ boleta, curp, correo, grupo, rol });
                            agregados++;
                        }
                    }
                }
            });

            if (agregados > 0) {
                mostrarToast(`${agregados} usuarios cargados desde el CSV`, 'success');
                actualizarTabla();
            } else {
                mostrarToast('No se encontraron datos válidos en el CSV', 'error');
            }
        };
        reader.readAsText(file);
    });

    // 3. ACTUALIZAR INTERFAZ Y TABLA
    function actualizarTabla() {
        tablaUsuarios.innerHTML = '';
        
        if (usuariosPendientes.length === 0) {
            tablaUsuarios.appendChild(filaVacia);
            badgeContador.innerText = '0 Usuarios';
            btnGuardarBaseDatos.disabled = true;
            btnGuardarBaseDatos.classList.add('opacity-50', 'cursor-not-allowed');
            return;
        }

        btnGuardarBaseDatos.disabled = false;
        btnGuardarBaseDatos.classList.remove('opacity-50', 'cursor-not-allowed');
        badgeContador.innerText = `${usuariosPendientes.length} Usuarios`;

        usuariosPendientes.forEach((user, index) => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 transition";
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${index + 1}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.boleta}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">${user.curp}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">${user.grupo}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.rol === 'administrador' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}">
                        ${user.rol}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onclick="eliminarUsuario(${index})" class="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tablaUsuarios.appendChild(tr);
        });
    }

    // 4. ELIMINAR DE LA LISTA LOCAL
    window.eliminarUsuario = function(index) {
        usuariosPendientes.splice(index, 1);
        actualizarTabla();
    };

    // 5. ENVIAR A MONGODB (BACKEND)
    btnGuardarBaseDatos.addEventListener('click', async () => {
        if(usuariosPendientes.length === 0) return;

        const confirmacion = confirm(`¿Estás seguro de enviar ${usuariosPendientes.length} usuarios a la base de datos?`);
        if(!confirmacion) return;

        const btnOriginalText = btnGuardarBaseDatos.innerHTML;
        btnGuardarBaseDatos.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        btnGuardarBaseDatos.disabled = true;

        try {
            // Petición al MOTOR de Exámenes (Puerto 3002)
            const respuesta = await fetch('http://148.204.239.124:3002/api/usuarios/generador', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuariosPendientes)
            });

            const data = await respuesta.json();

            if (!respuesta.ok) throw new Error(data.error || "Error en el servidor");

            let mensajeFinal = `¡Éxito! ${data.insertados} alumnos subidos.`;
            if (data.errores && data.errores.length > 0) {
                mensajeFinal += ` Pero hubo ${data.errores.length} omisiones (Ej. Boletas repetidas). Revisa la consola.`;
                console.warn("Reporte de Errores DB:", data.errores);
            }

            mostrarToast(mensajeFinal, 'success');
            
            // Si todo salió bien, limpiamos la lista
            usuariosPendientes = [];
            actualizarTabla();
            csvFileInput.value = ""; // Limpiar input de archivo

        } catch (error) {
            console.error("Error subiendo datos:", error);
            mostrarToast("Error de conexión al guardar los datos.", 'error');
        } finally {
            btnGuardarBaseDatos.innerHTML = btnOriginalText;
            btnGuardarBaseDatos.disabled = false;
        }
    });

    // 6. UTILIDAD: SISTEMA DE TOASTS
    function mostrarToast(mensaje, tipo = 'success') {
        const toast = document.createElement('div');
        
        const bgClass = tipo === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800';
        const icon = tipo === 'success' 
            ? '<i class="fas fa-check-circle text-green-500 text-xl"></i>'
            : '<i class="fas fa-exclamation-circle text-red-500 text-xl"></i>';

        toast.className = `toast-enter flex items-center p-4 mb-2 border-l-4 rounded shadow-md ${bgClass}`;
        toast.innerHTML = `
            <div class="mr-3">${icon}</div>
            <div class="text-sm font-semibold">${mensaje}</div>
        `;

        toastContainer.appendChild(toast);

        // Auto remover después de 4 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
});