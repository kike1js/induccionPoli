document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formEstadisticas');
    const btnPDF = document.getElementById('btnPDF');
    const btnPDFGraficas = document.getElementById('btnPDFGraficas'); 
    
    let datosStats = null; 
    let datosProfesor = null; 
    
    // Variables para destruir gráficas viejas antes de dibujar nuevas
    let chartAreasInstance = null;
    let chartMateriasInstance = null;

    // ========================================================
    // HELPER: Normalizador de texto (ignora acentos y mayúsculas)
    // ========================================================
    const normalizarTexto = (str) => {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    };

    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('fechaInicio').value = primerDia.toISOString().split('T')[0];
    document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];

    // ========================================================
    // 1. BÚSQUEDA GLOBAL Y DIBUJADO DE GRÁFICAS
    // ========================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const inputGrupo = document.getElementById('filtroGrupo').value.trim();
        const inputTurno = document.getElementById('filtroTurno').value;
        const inputMateria = document.getElementById('filtroMateria').value;
        const btnGenerar = document.getElementById('btnGenerar');

        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            alert("La fecha de inicio no puede ser mayor a la final.");
            return;
        }

        try {
            btnGenerar.disabled = true;
            btnGenerar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // Petición 1: Estadísticas Globales
            let urlStats = `https://www.bitacora.cecyt14.ipn.mx/api/examen/reporte-estadisticas?`;
            if(fechaInicio) urlStats += `fechaInicio=${fechaInicio}&`;
            if(fechaFin) urlStats += `fechaFin=${fechaFin}&`;
            if(inputTurno) urlStats += `turno=${inputTurno}&`;
            if(inputGrupo) urlStats += `grupo=${inputGrupo}&`;
            if(inputMateria) urlStats += `materia=${inputMateria}`;
            
            const resStats = await fetch(urlStats);
            datosStats = await resStats.json(); 
            if (!resStats.ok) throw new Error(datosStats.error || "Error en estadísticas");

            // Petición 2: Reporte de Profesor (Tramposos y Faltantes)
            let urlProfesor = `https://www.bitacora.cecyt14.ipn.mx/api/examen/reporte-profesor?`;
            if(fechaInicio) urlProfesor += `fechaInicio=${fechaInicio}&`;
            if(fechaFin) urlProfesor += `fechaFin=${fechaFin}&`;
            if(inputGrupo) urlProfesor += `grupo=${inputGrupo}&`;
            if(inputTurno) urlProfesor += `turno=${inputTurno}`;

            const resProfesor = await fetch(urlProfesor);
            datosProfesor = await resProfesor.json(); 
            if (!resProfesor.ok) throw new Error(datosProfesor.error || "Error en reporte de profesor");

            pintarDashboard(datosStats, datosProfesor);
            
            // Habilitamos botones PDF
            btnPDF.disabled = false;
            btnPDF.classList.replace('bg-gray-400', 'bg-red-600');
            btnPDF.classList.replace('cursor-not-allowed', 'hover:bg-red-700');

            btnPDFGraficas.disabled = false;
            btnPDFGraficas.classList.replace('bg-gray-400', 'bg-ipnGuinda');
            btnPDFGraficas.classList.replace('cursor-not-allowed', 'hover:bg-ipnGuindaClaro');

        } catch (error) {
            console.error(error);
            alert("Error consultando la base de datos.");
        } finally {
            btnGenerar.disabled = false;
            btnGenerar.innerHTML = '<i class="fas fa-search"></i>';
        }
    });

    function pintarDashboard(stats, prof) {
        document.getElementById('panelResultados').classList.remove('hidden');

        document.getElementById('kpiAlumnos').innerText = prof.totalAlumnosConsultados; 
        document.getElementById('kpiExamenes').innerText = stats.participacion.totalExamenes;
        document.getElementById('kpiCompletos').innerText = stats.participacion.alumnosCompletaronTodo;
        document.getElementById('kpiFaltantes').innerText = prof.totalFaltantes;
        document.getElementById('kpiTramposos').innerText = prof.totalTramposos; 

        // Destruir gráficas previas
        if (chartAreasInstance) chartAreasInstance.destroy();
        if (chartMateriasInstance) chartMateriasInstance.destroy();

        // Gráfica de Áreas
        const ctxAreas = document.getElementById('chartAreas').getContext('2d');
        chartAreasInstance = new Chart(ctxAreas, {
            type: 'bar',
            data: {
                labels: ['Ciencias Sociales', 'Ciencias Exactas', 'Experimentales'],
                datasets: [{
                    label: 'Promedio General (Base 10)',
                    data: [stats.promedios.sociales, stats.promedios.exactas, stats.promedios.experimentales],
                    backgroundColor: ['#6c1d45', '#1e3a8a', '#15803d'],
                    borderRadius: 4
                }]
            },
            options: { scales: { y: { beginAtZero: true, max: 10 } }, animation: { duration: 0 } }
        });

        // ===============================================
        // MAGIA VISUAL: GRAFICA DINÁMICA DE MATERIAS/TEMAS
        // ===============================================
        let datosParaGrafica = stats.rendimientoMaterias;
        let tituloGraficaSecundaria = 'Desempeño General por Materias (%)';
        
        const filtroMateriaVal = document.getElementById('filtroMateria').value;
        
        // Si aplicaron un filtro de materia, mostrar los TEMAS es más útil
        if (filtroMateriaVal !== 'TODAS') {
            const selectMateria = document.getElementById('filtroMateria');
            const nombreMateria = selectMateria.options[selectMateria.selectedIndex].text;
            datosParaGrafica = stats.rendimientoTemas; 
            tituloGraficaSecundaria = `Desempeño por Temas: ${nombreMateria} (%)`;
        }

        // Actualizar el título h3 que está justo antes del canvas
        const canvasMaterias = document.getElementById('chartMaterias');
        if(canvasMaterias && canvasMaterias.previousElementSibling) {
            canvasMaterias.previousElementSibling.innerText = tituloGraficaSecundaria;
        }

        const ordenados = [...datosParaGrafica].sort((a, b) => b.porcentaje - a.porcentaje);
        const labelsGrafica = ordenados.map(m => m.nombre);
        const dataGrafica = ordenados.map(m => m.porcentaje);

        const ctxMaterias = canvasMaterias.getContext('2d');
        chartMateriasInstance = new Chart(ctxMaterias, {
            type: 'bar',
            data: {
                labels: labelsGrafica,
                datasets: [{
                    label: '% de Acierto',
                    data: dataGrafica,
                    backgroundColor: '#8a2558',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                scales: { x: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: false } },
                animation: { duration: 0 }
            }
        });
    }

    // ========================================================
    // 2. GENERADORES DE PDF GLOBALES (GRÁFICO Y ANALÍTICO)
    // ========================================================
    const estilosComunesPDF = `
        body { font-family: 'Helvetica', Arial, sans-serif; color: #333; padding: 20px; font-size: 11px; }
        .header { border-bottom: 2px solid #6c1d45; padding-bottom: 8px; margin-bottom: 12px; text-align: center; }
        .header h1 { color: #6c1d45; margin: 0; font-size: 16px; text-transform: uppercase; }
        .subtitle { color: #555; font-size: 11px; margin-top: 4px; }
        .section-title { font-size: 14px; color: #6c1d45; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 15px; margin-bottom: 8px;}
        table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 10px; }
        th { background-color: #f3f4f6; color: #333; padding: 4px 6px; text-align: left; border: 1px solid #ddd; font-size: 10px;}
        td { padding: 3px 6px; border: 1px solid #ddd; }
        .badge { padding: 2px 5px; border-radius: 3px; font-size: 9px; font-weight: bold; color: white; }
        .bg-red { background-color: #dc2626; } .bg-green { background-color: #16a34a; } .bg-blue { background-color: #2563eb; }
        .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px;}
        @media print { .page-break { page-break-before: always; } }
    `;

    // 2A. REPORTE GRÁFICO EJECUTIVO
    btnPDFGraficas.addEventListener('click', () => {
        if(!chartAreasInstance || !chartMateriasInstance) return;
        const imgAreas = document.getElementById('chartAreas').toDataURL('image/png');
        const imgMaterias = document.getElementById('chartMaterias').toDataURL('image/png');
        
        // Obtenemos el título dinámico para el PDF
        const tituloSegundaGrafica = document.getElementById('chartMaterias').previousElementSibling.innerText;
        
        const ventanaImpresion = window.open('', '', 'height=800,width=800');

        const htmlDocument = `
            <html>
            <head>
                <title>Reporte Gráfico Ejecutivo</title>
                <style>
                    ${estilosComunesPDF}
                    .chart-container { margin: 10px auto; width: 90%; text-align: center; }
                    img { width: 100%; max-height: 400px; object-fit: contain; border: 1px solid #eee; padding: 10px; border-radius: 6px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reporte Gráfico Ejecutivo</h1>
                    <div class="subtitle">Simulador de Inducción - CECyT 14</div>
                    <div class="subtitle"><strong>Grupo:</strong> ${document.getElementById('filtroGrupo').value || 'TODOS'} | <strong>Turno:</strong> ${document.getElementById('filtroTurno').value} | <strong>Materia:</strong> ${document.getElementById('filtroMateria').options[document.getElementById('filtroMateria').selectedIndex].text}</div>
                </div>

                <div class="chart-container">
                    <h2 class="section-title" style="text-align:center;">1. Promedio por Áreas de Conocimiento</h2>
                    <img src="${imgAreas}" />
                </div>
                <div class="page-break"></div>
                <div class="chart-container">
                    <h2 class="section-title" style="text-align:center;">2. ${tituloSegundaGrafica}</h2>
                    <img src="${imgMaterias}" />
                </div>
            </body>
            </html>
        `;
        ventanaImpresion.document.write(htmlDocument);
        ventanaImpresion.document.close();
        ventanaImpresion.focus();
        setTimeout(() => { ventanaImpresion.print(); ventanaImpresion.close(); }, 500);
    });

    // 2B. REPORTE ANALÍTICO TABULAR (Árbol con Porcentajes)
    btnPDF.addEventListener('click', () => {
        if(!datosStats || !datosProfesor) return;
        const ventanaImpresion = window.open('', '', 'height=800,width=800');
        
        const crearArbolGlobal = (arbol) => {
            const filtroMateriaVal = document.getElementById('filtroMateria').value;
            let html = `<h2 class="section-title">Análisis de Precisión (Materia ➔ Tema ➔ Subtema)</h2>`;
            
            for (const [materia, dataMateria] of Object.entries(arbol)) {
                if(dataMateria.total === 0) continue;
                
                // VALIDACIÓN EXTRA FRONTAL PARA ASEGURAR EL FILTRADO
                if (filtroMateriaVal !== 'TODAS' && normalizarTexto(materia) !== normalizarTexto(filtroMateriaVal)) continue;

                const porcMat = ((dataMateria.aciertos / dataMateria.total) * 100).toFixed(1);
                html += `
                <div style="margin-top: 10px; border: 1px solid #ccc; border-radius: 4px; page-break-inside: avoid;">
                    <div style="background-color: #e5e7eb; padding: 4px 8px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between;">
                        <span>📚 ${materia.toUpperCase()}</span>
                        <span>Global: ${porcMat}% (${dataMateria.aciertos}/${dataMateria.total})</span>
                    </div>
                    <table style="margin:0; border:none; width: 100%;">
                        <tr style="background-color: #f9fafb;">
                            <th style="border:none; border-bottom: 1px solid #ddd;">Jerarquía Temática</th>
                            <th style="border:none; border-bottom: 1px solid #ddd; width: 60px; text-align:center;">Aciertos</th>
                            <th style="border:none; border-bottom: 1px solid #ddd; width: 50px; text-align:center;">%</th>
                        </tr>`;

                for (const [tema, dataTema] of Object.entries(dataMateria.temas)) {
                    if(dataTema.total === 0) continue;
                    const porcTema = ((dataTema.aciertos / dataTema.total) * 100).toFixed(1);
                    html += `
                        <tr style="background-color: #fdfdfd;">
                            <td style="padding: 3px 6px; font-weight: bold; color: #4b5563; border:none; border-bottom: 1px solid #eee;">↳ ${tema}</td>
                            <td style="padding: 3px; text-align: center; font-weight: bold; border:none; border-bottom: 1px solid #eee;">${dataTema.aciertos}/${dataTema.total}</td>
                            <td style="padding: 3px; text-align: center; font-weight: bold; border:none; border-bottom: 1px solid #eee;">${porcTema}%</td>
                        </tr>`;

                    for (const [subtema, dataSubtema] of Object.entries(dataTema.subtemas)) {
                        if(dataSubtema.total === 0) continue;
                        const porcSub = ((dataSubtema.aciertos / dataSubtema.total) * 100).toFixed(1);
                        const colorSub = porcSub < 60 ? 'color: #dc2626;' : 'color: #333;';
                        html += `
                        <tr>
                            <td style="padding: 2px 6px 2px 20px; border:none; border-bottom: 1px solid #f5f5f5; ${colorSub}">• ${subtema}</td>
                            <td style="padding: 2px; text-align: center; border:none; border-bottom: 1px solid #f5f5f5; ${colorSub}">${dataSubtema.aciertos}/${dataSubtema.total}</td>
                            <td style="padding: 2px; text-align: center; border:none; border-bottom: 1px solid #f5f5f5; ${colorSub}">${porcSub}%</td>
                        </tr>`;
                    }
                }
                html += `</table></div>`;
            }
            return html;
        };

        let faltantesHTML = datosProfesor.listaFaltantes.length === 0 
            ? '<p style="color:green; text-align:center; font-size: 11px;">✓ Todos los alumnos han completado sus exámenes.</p>' 
            : `<table><tr style="background:#fefce8;"><th style="background:#fefce8;">Boleta/Nombre</th><th style="background:#fefce8;">Sociales</th><th style="background:#fefce8;">Exactas</th><th style="background:#fefce8;">Exp.</th></tr>
               ${datosProfesor.listaFaltantes.map(f => {
                   const formatEstado = (st) => st === 'finalizado' ? '<span class="badge bg-green">FIN</span>' : (st === 'en_curso' ? '<span class="badge bg-blue">CURSO</span>' : '<span class="badge bg-red">NADA</span>');
                   const stSoc = f.estados ? f.estados.sociales : 'finalizado';
                   const stExa = f.estados ? f.estados.exactas : 'finalizado';
                   const stExp = f.estados ? f.estados.experimentales : 'finalizado';
                   return `<tr><td>${f.boleta} - ${f.nombre}</td><td style="text-align:center;">${formatEstado(stSoc)}</td><td style="text-align:center;">${formatEstado(stExa)}</td><td style="text-align:center;">${formatEstado(stExp)}</td></tr>`;
               }).join('')}</table>`;

        let trampososHTML = datosProfesor.listaTramposos.length === 0 
            ? '<p style="color:green; text-align:center; font-size: 11px;">✓ No se detectaron infracciones.</p>' 
            : `<table><tr style="background:#fef2f2;"><th style="background:#fef2f2;">Alumno</th><th style="background:#fef2f2;">Boleta</th><th style="background:#fef2f2;">Anulados</th></tr>
               ${datosProfesor.listaTramposos.map(t => `<tr><td>${t.nombre}</td><td>${t.boleta}</td><td style="color:#dc2626; font-weight:bold;">${t.examenesAnulados.join(', ').toUpperCase()}</td></tr>`).join('')}</table>`;

        const htmlDocument = `
            <html>
            <head><title>Acuse Analítico - CECyT 14</title><style>${estilosComunesPDF}</style></head>
            <body>
                <div class="header">
                    <h1>Reporte Directivo Analítico</h1>
                    <div class="subtitle">Turno: ${datosProfesor.filtroTurno} | Grupo: ${datosProfesor.filtroGrupo} | Materia: ${document.getElementById('filtroMateria').options[document.getElementById('filtroMateria').selectedIndex].text}</div>
                </div>

                <div style="display: flex; justify-content: space-between; gap: 10px;">
                    <div style="width: 50%;">
                        <h2 class="section-title">1. Desempeño por Área (Base 10)</h2>
                        <table>
                            <tr><th>Área</th><th>Promedio</th></tr>
                            <tr><td>Sociales</td><td>${datosStats.promedios.sociales}</td></tr>
                            <tr><td>Exactas</td><td>${datosStats.promedios.exactas}</td></tr>
                            <tr><td>Experimentales</td><td>${datosStats.promedios.experimentales}</td></tr>
                        </table>
                    </div>
                    <div style="width: 50%;">
                        <h2 class="section-title">2. Participación</h2>
                        <table>
                            <tr><td>Evaluados Totales</td><td style="font-weight:bold;">${datosProfesor.totalAlumnosConsultados}</td></tr>
                            <tr><td>Exámenes Entregados</td><td style="font-weight:bold;">${datosStats.participacion.totalExamenes}</td></tr>
                            <tr><td>Alumnos Completos</td><td style="font-weight:bold;">${datosStats.participacion.alumnosCompletaronTodo}</td></tr>
                        </table>
                    </div>
                </div>

                ${crearArbolGlobal(datosStats.arbolJerarquico)}

                <h2 class="section-title" style="color:#ca8a04;">Alumnos Incompletos</h2>
                ${faltantesHTML}

                <h2 class="section-title" style="color:#dc2626;">Infracciones y Fraudes</h2>
                ${trampososHTML}
                
                <div class="footer">Generado automáticamente por PoliAprende. ${new Date().toLocaleString()}</div>
            </body>
            </html>
        `;
        ventanaImpresion.document.write(htmlDocument);
        ventanaImpresion.document.close();
        ventanaImpresion.focus();
        setTimeout(() => { ventanaImpresion.print(); ventanaImpresion.close(); }, 500);
    });

    // ========================================================
    // 3. BÚSQUEDA INDIVIDUAL Y PDF (Solo Fracciones Acierto/Total)
    // ========================================================
    const formIndividual = document.getElementById('formIndividual');
    const btnPDFIndividual = document.getElementById('btnPDFIndividual');
    let datosAlumnoActual = null;

    formIndividual.addEventListener('submit', async (e) => {
        e.preventDefault();
        const boleta = document.getElementById('inputBoleta').value.trim();
        const btnBuscar = document.getElementById('btnBuscarAlumno');
        const resUI = document.getElementById('resIndividualUI');
        
        try {
            btnBuscar.disabled = true;
            btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            resUI.classList.add('hidden');
            btnPDFIndividual.disabled = true;
            btnPDFIndividual.classList.replace('bg-red-600', 'bg-gray-400');
            btnPDFIndividual.classList.add('cursor-not-allowed');

            const respuesta = await fetch(`https://www.bitacora.cecyt14.ipn.mx/api/examen/reporte-individual/${boleta}`);
            const data = await respuesta.json();

            if (!respuesta.ok) throw new Error(data.error || "No encontrado");
            datosAlumnoActual = data;
            
            document.getElementById('txtNombreAlumno').innerText = data.nombre;
            document.getElementById('txtAlumnoEncontrado').innerText = `Boleta: ${data.boleta} | Grupo: ${data.grupo} | Turno: ${data.turno}`;
            resUI.classList.remove('hidden');

            btnPDFIndividual.disabled = false;
            btnPDFIndividual.classList.replace('bg-gray-400', 'bg-red-600');
            btnPDFIndividual.classList.remove('cursor-not-allowed');
            btnPDFIndividual.classList.add('hover:bg-red-700');

        } catch (error) {
            alert(error.message);
        } finally {
            btnBuscar.disabled = false;
            btnBuscar.innerHTML = '<i class="fas fa-search"></i> Buscar';
        }
    });

    btnPDFIndividual.addEventListener('click', () => {
        if(!datosAlumnoActual) return;
        const d = datosAlumnoActual;
        const ventanaImpresion = window.open('', '', 'height=800,width=800');
        
        const crearArbolIndividual = (arbol) => {
            const filtroMateriaVal = document.getElementById('filtroMateria').value;
            let html = `<h2 class="section-title">Análisis de Desempeño por Materia, Tema y Subtema</h2>`;
            
            for (const [materia, dataMateria] of Object.entries(arbol)) {
                if(dataMateria.total === 0) continue;
                
                // ¡AQUÍ ESTÁ LA MAGIA INDIVIDUAL! Filtramos el árbol de resultados según el selector global
                if (filtroMateriaVal !== 'TODAS' && normalizarTexto(materia) !== normalizarTexto(filtroMateriaVal)) continue;

                html += `
                <div style="margin-top: 10px; border: 1px solid #ccc; border-radius: 4px; page-break-inside: avoid;">
                    <div style="background-color: #e5e7eb; padding: 4px 8px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between;">
                        <span>📚 ${materia.toUpperCase()}</span>
                        <span>Total: ${dataMateria.aciertos}/${dataMateria.total}</span>
                    </div>
                    <table style="margin:0; border:none; width: 100%;">
                        <tr style="background-color: #f9fafb;">
                            <th style="border:none; border-bottom: 1px solid #ddd;">Jerarquía Temática</th>
                            <th style="border:none; border-bottom: 1px solid #ddd; width: 80px; text-align:center;">Aciertos</th>
                        </tr>`;

                for (const [tema, dataTema] of Object.entries(dataMateria.temas)) {
                    if(dataTema.total === 0) continue;
                    html += `
                        <tr style="background-color: #fdfdfd;">
                            <td style="padding: 3px 6px; font-weight: bold; color: #4b5563; border:none; border-bottom: 1px solid #eee;">↳ ${tema}</td>
                            <td style="padding: 3px; text-align: center; font-weight: bold; border:none; border-bottom: 1px solid #eee;">${dataTema.aciertos}/${dataTema.total}</td>
                        </tr>`;

                    for (const [subtema, dataSubtema] of Object.entries(dataTema.subtemas)) {
                        if(dataSubtema.total === 0) continue;
                        const isDebil = (dataSubtema.aciertos / dataSubtema.total) < 0.6;
                        const colorSub = isDebil ? 'color: #dc2626;' : 'color: #333;';
                        html += `
                        <tr>
                            <td style="padding: 2px 6px 2px 20px; border:none; border-bottom: 1px solid #f5f5f5; ${colorSub}">• ${subtema}</td>
                            <td style="padding: 2px; text-align: center; border:none; border-bottom: 1px solid #f5f5f5; ${colorSub}">${dataSubtema.aciertos}/${dataSubtema.total}</td>
                        </tr>`;
                    }
                }
                html += `</table></div>`;
            }
            return html;
        };

        const htmlDocument = `
            <html>
            <head><title>Acuse Individual - ${d.boleta}</title><style>${estilosComunesPDF} .student-info { background: #f9fafb; padding: 10px; border-left: 4px solid #6c1d45; margin-bottom: 15px; font-size:11px;}</style></head>
            <body>
                <div class="header">
                    <h1>Acuse de Resultados Académicos</h1>
                    <div class="subtitle">Simulador de Examen de Inducción | CECyT 14</div>
                </div>

                <div class="student-info">
                    <strong>Alumno:</strong> ${d.nombre} <br>
                    <strong>Boleta:</strong> ${d.boleta} | <strong>CURP:</strong> ${d.curp} <br>
                    <strong>Turno:</strong> ${d.turno} | <strong>Grupo:</strong> ${d.grupo}
                </div>

                <h2 class="section-title">Calificaciones de Área (Base 10)</h2>
                <table>
                    <tr><th>Área de Conocimiento</th><th>Calificación Obtenida</th></tr>
                    <tr><td>Ciencias Sociales</td><td>${d.areas.sociales.calificacion} ${d.areas.sociales.anulado ? '<span class="badge bg-red">ANULADO</span>' : ''}</td></tr>
                    <tr><td>Ciencias Exactas</td><td>${d.areas.exactas.calificacion} ${d.areas.exactas.anulado ? '<span class="badge bg-red">ANULADO</span>' : ''}</td></tr>
                    <tr><td>Ciencias Experimentales</td><td>${d.areas.experimentales.calificacion} ${d.areas.experimentales.anulado ? '<span class="badge bg-red">ANULADO</span>' : ''}</td></tr>
                </table>

                ${crearArbolIndividual(d.arbolJerarquico)}

                <div class="footer">Documento de carácter diagnóstico generado por PoliAprende. ${new Date().toLocaleString()}</div>
            </body>
            </html>
        `;
        ventanaImpresion.document.write(htmlDocument);
        ventanaImpresion.document.close();
        ventanaImpresion.focus();
        setTimeout(() => { ventanaImpresion.print(); ventanaImpresion.close(); }, 500);
    });
});