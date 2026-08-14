/**
         * ============================================================
         * ARCHIVO: seguridad_experimental.js
         * ============================================================
         */
        let advertenciasSeguridad = parseInt(localStorage.getItem('advertencias_experimentales')) || 0;
        const MAX_ADVERTENCIAS = 3;
        const domContadorAdv = document.getElementById('contador-advertencias');

        let bloqueoSistema = false; 
        let examenCancelado = advertenciasSeguridad >= MAX_ADVERTENCIAS;

        domContadorAdv.innerText = advertenciasSeguridad;

        if (examenCancelado) {
            forzarEnvioExamen();
        }

        document.body.addEventListener('click', solicitarPantallaCompleta, { once: true });

        function solicitarPantallaCompleta() {
            if (!document.fullscreenElement && !examenCancelado) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn("Esperando interacción del usuario para pantalla completa...");
                });
            }
        }

        function registrarInfraccion() {
            if (bloqueoSistema || examenCancelado) return; 

            bloqueoSistema = true; 
            advertenciasSeguridad++;
            localStorage.setItem('advertencias_experimentales', advertenciasSeguridad);
            domContadorAdv.innerText = advertenciasSeguridad;

            if (advertenciasSeguridad >= MAX_ADVERTENCIAS) {
                examenCancelado = true;
                forzarEnvioExamen();
            } else {
                mostrarCastigoUI(advertenciasSeguridad);
            }
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) registrarInfraccion();
        });

        window.addEventListener("blur", () => {
            registrarInfraccion();
        });

        document.addEventListener("fullscreenchange", () => {
            if (!document.fullscreenElement && !bloqueoSistema) {
                registrarInfraccion();
            }
        });

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
                    <button id="btn-reanudar" class="w-full px-6 py-3 bg-ipnGuinda text-white font-bold rounded-xl shadow-md hover:bg-ipnGuindaClaro transition">
                        Entendido, volver a Pantalla Completa
                    </button>
                </div>
            `;
            
            document.body.appendChild(modal);

            document.getElementById('btn-reanudar').onclick = () => {
                document.documentElement.requestFullscreen().then(() => {
                    modal.remove();
                    setTimeout(() => { bloqueoSistema = false; }, 500);
                }).catch(err => {
                    alert("Debes permitir la pantalla completa para continuar el examen.");
                });
            };
        }

        function apagarSeguridad() {
            bloqueoSistema = true; 
            examenCancelado = true; 
            console.log("Seguridad desactivada: El examen está en proceso de entrega legal.");
        }

        function forzarEnvioExamen() {
            bloqueoSistema = true;
            
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
            
            setTimeout(() => {
                if (typeof finalizarExamen === "function") {
                    finalizarExamen("trampa");
                }
            }, 2000);
        }

        // MODO DESARROLLADOR: Limpiar memoria rápida
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 'r') {
                localStorage.clear();
                alert("MODO DEV: Memoria limpiada. Reiniciando examen...");
                window.location.reload();
            }
        });