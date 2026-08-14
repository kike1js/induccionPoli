        // ==========================================
        // LÓGICA DE LA PANTALLA "SÚPER DASHBOARD" (Intento Único)
        // ==========================================
        document.addEventListener('DOMContentLoaded', async () => {
            const boleta = localStorage.getItem('boleta_activa') || "Usuario Desconocido";
            document.getElementById('boleta-display').innerText = `Boleta: ${boleta}`;

            if (boleta === "Usuario Desconocido") return;

            // 1. Mostrar si hubo una anulación reciente
            const ultimoExamenStr = localStorage.getItem('ultimo_resultado_examen');
            if (ultimoExamenStr) {
                const ultimoExamen = JSON.parse(ultimoExamenStr);
                if (ultimoExamen.anulado) {
                    alert("EXAMEN ANULADO: Se ha registrado una infracción de seguridad en tu último intento.");
                }
                localStorage.removeItem('ultimo_resultado_examen');
            }

            // 2. OBTENER ESTADÍSTICAS DIRECTAMENTE DESDE EL NODO DE EXÁMENES (Populate)
            try {
                const response = await fetch(`http://bitacoras.cecyt14.ipn.mx/api/examen/stats/${boleta}`);
                if (!response.ok) throw new Error("No se pudieron cargar las estadísticas.");
                
                const stats = await response.json();
                const examenes = stats.examenesResueltos || [];

                // 3. Filtrar el nodo del examen único por cada área
                const soc = examenes.find(e => e.area_examen === "ciencias sociales");
                const exa = examenes.find(e => e.area_examen === "ciencias exactas");
                const exp = examenes.find(e => e.area_examen === "ciencias experimentales");

                // 4. Renderizar cada tarjeta con el documento del examen
                actualizarTarjeta('sociales', soc, 'bg-socialesAzul');
                actualizarTarjeta('exactas', exa, 'bg-exactasRojo');
                actualizarTarjeta('exper', exp, 'bg-experVerde');

            } catch (error) {
                console.error("Error cargando dashboard:", error);
            }
        });

        function actualizarTarjeta(idHtml, examenData, colorBarraClass) {
            const statusBadge = document.getElementById(`status-${idHtml}`);

            if (!examenData) {
                statusBadge.innerText = "Disponible";
                statusBadge.className = "px-4 py-2 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider inline-block shadow-sm";
                return;
            }

            // Si existe el examen, mostramos los aciertos y calificación
            document.getElementById(`aciertos-${idHtml}`).innerText = examenData.aciertos || 0;
            document.getElementById(`calificacion-${idHtml}`).innerText = examenData.calificacion_final || 0;

            if (examenData.examen_anulado) {
                statusBadge.innerText = "Bloqueado (Infracción)";
                statusBadge.className = "px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider inline-block shadow-sm";
            } else {
                statusBadge.innerText = "Completado";
                statusBadge.className = "px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-full uppercase tracking-wider inline-block shadow-sm";
            }

            // Renderizar Desglose por Materias directo del nodo del examen
            if (examenData.desglose_materias && Object.keys(examenData.desglose_materias).length > 0) {
                renderizarDesgloseMaterias(idHtml, examenData.desglose_materias, colorBarraClass);
            } else {
                document.getElementById(`desglose-${idHtml}`).innerHTML = '<p class="text-gray-400 text-sm italic">Sin desglose disponible.</p>';
            }
        }

        function renderizarDesgloseMaterias(idHtml, desglose, colorBarraClass) {
            const contenedor = document.getElementById(`desglose-${idHtml}`);
            contenedor.innerHTML = ''; 

            for (const materia in desglose) {
                const info = desglose[materia];
                const porcentaje = info.total > 0 ? Math.round((info.aciertos / info.total) * 100) : 0;

                const item = document.createElement('div');
                item.className = "w-full";
                item.innerHTML = `
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-gray-700 text-sm">${materia}</span>
                        <span class="text-xs font-bold text-gray-500">${info.aciertos} / ${info.total} (${porcentaje}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div class="${colorBarraClass} h-full transition-all duration-1000" style="width: ${porcentaje}%"></div>
                    </div>
                `;
                contenedor.appendChild(item);
            }
        }