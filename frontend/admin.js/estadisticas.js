document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formEstadisticas');
    const btnPDF = document.getElementById('btnPDF');
    
    let datosStats = null; 
    let datosProfesor = null; 

    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('fechaInicio').value = primerDia.toISOString().split('T')[0];
    document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];

    // ========================================================
    // BÚSQUEDA GLOBAL
    // ========================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const inputGrupo = document.getElementById('filtroGrupo').value.trim();
        const inputTurno = document.getElementById('filtroTurno').value;
        const btnGenerar = document.getElementById('btnGenerar');

        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            alert("La fecha de inicio no puede ser mayor a la final.");
            return;
        }

        try {
            btnGenerar.disabled = true;
            btnGenerar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';

            // 1. Estadísticas Globales
            let urlStats = `https://www.bitacora.cecyt14.ipn.mx/api/examen/reporte-estadisticas?`;
            if(fechaInicio) urlStats += `fechaInicio=${fechaInicio}&`;
            if(fechaFin) urlStats += `fechaFin=${fechaFin}&`;
            if(inputTurno) urlStats += `turno=${inputTurno}`;
            
            const resStats = await fetch(urlStats);
            datosStats = await resStats.json(); 
            if (!resStats.ok) throw new Error(datosStats.error || "Error en estadísticas");

            // 2. Reporte de Profesor (Tramposos y Faltantes)
            let urlProfesor = `https://www.bitacora.cecyt14.ipn.mx/api/examen/reporte-profesor?`;
            if(fechaInicio) urlProfesor += `fechaInicio=${fechaInicio}&`;
            if(fechaFin) urlProfesor += `fechaFin=${fechaFin}&`;
            if(inputGrupo) urlProfesor += `grupo=${inputGrupo}&`;
            if(inputTurno) urlProfesor += `turno=${inputTurno}`;

            const resProfesor = await fetch(urlProfesor);
            datosProfesor = await resProfesor.json(); 
            if (!resProfesor.ok) throw new Error(datosProfesor.error || "Error en reporte de profesor");

            pintarDashboard(datosStats, datosProfesor);
            
            btnPDF.disabled = false;
            btnPDF.classList.replace('bg-gray-400', 'bg-red-600');
            btnPDF.classList.replace('cursor-not-allowed', 'hover:bg-red-700');

        } catch (error) {
            console.error(error);
            alert("Error consultando la base de datos.");
        } finally {
            btnGenerar.disabled = false;
            btnGenerar.innerHTML = '<i class="fas fa-search"></i> Consultar';
        }
    });

    function pintarDashboard(stats, prof) {
        document.getElementById('panelResultados').classList.remove('hidden');

        document.getElementById('kpiAlumnos').innerText = prof.totalAlumnosConsultados; 
        document.getElementById('kpiExamenes').innerText = stats.participacion.totalExamenes;
        document.getElementById('kpiCompletos').innerText = stats.participacion.alumnosCompletaronTodo;
        document.getElementById('kpiFaltantes').innerText = prof.totalFaltantes;
        document.getElementById('kpiTramposos').innerText = prof.totalTramposos; 

        const listaP = document.getElementById('listaPromedios');
        listaP.innerHTML = `
            <li class="flex justify-between items-center bg-gray-50 p-3 rounded"><span class="font-semibold text-gray-700">Ciencias Sociales</span> <span class="font-black text-ipnGuinda">${stats.promedios.sociales}</span></li>
            <li class="flex justify-between items-center bg-gray-50 p-3 rounded"><span class="font-semibold text-gray-700">Ciencias Exactas</span> <span class="font-black text-ipnGuinda">${stats.promedios.exactas}</span></li>
            <li class="flex justify-between items-center bg-gray-50 p-3 rounded"><span class="font-semibold text-gray-700">Cs. Experimentales</span> <span class="font-black text-ipnGuinda">${stats.promedios.experimentales}</span></li>
        `;

        const listaD = document.getElementById('listaDebiles');
        listaD.innerHTML = '';
        if(stats.rendimientoMaterias.length === 0) {
            listaD.innerHTML = '<li class="text-gray-500 italic">No hay datos suficientes.</li>';
        } else {
            const soloDebilesUI = [...stats.rendimientoMaterias].slice(0, 5);
            soloDebilesUI.forEach((item, index) => {
                listaD.innerHTML += `
                    <li class="flex justify-between items-center">
                        <span class="text-gray-700 text-sm"><span class="font-bold text-red-500 mr-2">#${index+1}</span> ${item.nombre}</span>
                        <span class="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">${item.porcentaje}% Acierto</span>
                    </li>
                `;
            });
        }

        // ===============================================
        // INYECCIÓN DINÁMICA: TABLA DE ALUMNOS FALTANTES
        // ===============================================
        let tablaFaltantes = document.getElementById('tablaFaltantesUI');
        if(!tablaFaltantes) {
            tablaFaltantes = document.createElement('div');
            tablaFaltantes.id = 'tablaFaltantesUI';
            tablaFaltantes.className = 'bg-white p-6 rounded-2xl shadow border border-gray-200 mt-8 mb-8';
            document.getElementById('panelResultados').appendChild(tablaFaltantes);
        }
        
        let htmlF = `
            <h3 class="text-lg font-bold text-yellow-600 mb-4 border-b border-yellow-200 pb-2">
                <i class="fas fa-user-clock"></i> Estatus de Exámenes: Alumnos Incompletos
            </h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th class="px-4 py-3">Nombre</th>
                            <th class="px-4 py-3">Boleta</th>
                            <th class="px-4 py-3 text-center">Sociales</th>
                            <th class="px-4 py-3 text-center">Exactas</th>
                            <th class="px-4 py-3 text-center">Experimentales</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if(prof.listaFaltantes.length === 0){
            htmlF += `<tr><td colspan="5" class="px-4 py-4 text-center font-bold text-green-600">Todos los alumnos consultados han completado sus exámenes.</td></tr>`;
        } else {
            prof.listaFaltantes.forEach(f => {
                // Función para colocar insignias visuales (badges) en la UI
                const getBadge = (estado) => {
                    if (estado === 'finalizado') return '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Finalizado</span>';
                    if (estado === 'en_curso') return '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">En Curso</span>';
                    return '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">No Iniciado</span>';
                };
                
                // Leemos los estados extraídos del modelo
                const stSoc = f.estados ? f.estados.sociales : (f.faltan.includes('Ciencias Sociales') ? 'no_iniciado' : 'finalizado');
                const stExa = f.estados ? f.estados.exactas : (f.faltan.includes('Ciencias Exactas') ? 'no_iniciado' : 'finalizado');
                const stExp = f.estados ? f.estados.experimentales : (f.faltan.includes('Cs. Experimentales') ? 'no_iniciado' : 'finalizado');

                htmlF += `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="px-4 py-3 font-medium text-gray-900">${f.nombre}</td>
                        <td class="px-4 py-3">${f.boleta}</td>
                        <td class="px-4 py-3 text-center">${getBadge(stSoc)}</td>
                        <td class="px-4 py-3 text-center">${getBadge(stExa)}</td>
                        <td class="px-4 py-3 text-center">${getBadge(stExp)}</td>
                    </tr>
                `;
            });
        }
        htmlF += `</tbody></table></div>`;
        tablaFaltantes.innerHTML = htmlF;
    }

    // ==========================
    // GENERAR PDF GLOBAL
    // ==========================
    btnPDF.addEventListener('click', () => {
        if(!datosStats || !datosProfesor) return;

        const ventanaImpresion = window.open('', '', 'height=800,width=800');
        
        // Creador de tablas genérico para %
        const crearTablaGlobal = (arreglo, titulo) => {
            if (!arreglo || arreglo.length === 0) return '';
            let html = `<h2 class="section-title">${titulo}</h2><table><tr><th>#</th><th>Nombre</th><th>% Acierto</th></tr>`;
            // Quitamos el límite de .slice(0, 10) para desglosar TODOS los temas y subtemas en el reporte global
            arreglo.forEach((item, i) => { 
                html += `<tr><td>${i+1}</td><td>${item.nombre}</td><td style="font-weight:bold;">${item.porcentaje}%</td></tr>`;
            });
            return html + '</table>';
        };

        // Faltantes y Tramposos
        let faltantesHTML = datosProfesor.listaFaltantes.length === 0 
            ? '<p style="color:green; text-align:center; margin-top:10px;">✓ Todos los alumnos han completado sus exámenes.</p>' 
            : `<table><tr style="background:#ca8a04;"><th>Nombre</th><th>Boleta</th><th>Sociales</th><th>Exactas</th><th>Experimentales</th></tr>
               ${datosProfesor.listaFaltantes.map(f => {
                   const formatEstado = (st) => {
                       if(st === 'finalizado') return '<span style="color:green;">Finalizado</span>';
                       if(st === 'en_curso') return '<span style="color:blue;">En Curso</span>';
                       return '<span style="color:red;">No Iniciado</span>';
                   };
                   
                   const stSoc = f.estados ? f.estados.sociales : (f.faltan.includes('Ciencias Sociales') ? 'no_iniciado' : 'finalizado');
                   const stExa = f.estados ? f.estados.exactas : (f.faltan.includes('Ciencias Exactas') ? 'no_iniciado' : 'finalizado');
                   const stExp = f.estados ? f.estados.experimentales : (f.faltan.includes('Cs. Experimentales') ? 'no_iniciado' : 'finalizado');
                   
                   return `<tr>
                     <td>${f.nombre}</td>
                     <td>${f.boleta}</td>
                     <td style="text-align:center; font-weight:bold;">${formatEstado(stSoc)}</td>
                     <td style="text-align:center; font-weight:bold;">${formatEstado(stExa)}</td>
                     <td style="text-align:center; font-weight:bold;">${formatEstado(stExp)}</td>
                   </tr>`;
               }).join('')}</table>`;

        let trampososHTML = datosProfesor.listaTramposos.length === 0 
            ? '<p style="color:green; text-align:center; margin-top:10px;">✓ No se detectaron infracciones.</p>' 
            : `<table><tr style="background:#dc2626;"><th>Nombre</th><th>Boleta</th><th>Grupo</th><th>Turno</th><th>Anulados</th></tr>
               ${datosProfesor.listaTramposos.map(t => `<tr><td>${t.nombre}</td><td>${t.boleta}</td><td>${t.grupo}</td><td>${t.turno}</td><td style="color:#dc2626;">${t.examenesAnulados.join(', ').toUpperCase()}</td></tr>`).join('')}</table>`;

        const htmlDocument = `
            <html>
            <head>
                <title>Acuse Grupal</title>
                <style>
                    body { font-family: 'Helvetica', Arial, sans-serif; color: #333; padding: 30px; }
                    .header { border-bottom: 3px solid #6c1d45; padding-bottom: 15px; margin-bottom: 15px; text-align: center; }
                    .header h1 { color: #6c1d45; margin: 0; font-size: 22px; text-transform: uppercase; }
                    .subtitle { color: #555; font-size: 12px; margin-top: 5px; }
                    .section-title { font-size: 14px; color: #6c1d45; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px;}
                    .grid { display: flex; justify-content: space-between; margin-top: 15px; gap: 10px;}
                    .box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; width: 20%; text-align: center; border-radius: 8px; font-size: 12px;}
                    .box strong { display: block; font-size: 20px; color: #333; margin-top: 10px;}
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th { background-color: #6c1d45; color: white; padding: 8px; text-align: left; }
                    td { padding: 6px; border-bottom: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reporte Directivo - Simulador de Inducción</h1>
                    <div class="subtitle">CECyT 14 "Luis Enrique Erro" - UDI</div>
                    <div class="subtitle" style="margin-top:10px; font-size:14px;">
                        <strong>Filtros:</strong> Turno: ${datosProfesor.filtroTurno} | Grupo: ${datosProfesor.filtroGrupo} 
                    </div>
                </div>

                <h2 class="section-title">1. Resumen de Participación</h2>
                <div class="grid">
                    <div class="box">Evaluados <strong>${datosProfesor.totalAlumnosConsultados}</strong></div>
                    <div class="box">Exámenes <strong>${datosStats.participacion.totalExamenes}</strong></div>
                    <div class="box">Completos <strong>${datosStats.participacion.alumnosCompletaronTodo}</strong></div>
                    <div class="box" style="border-color:#fef08a; background:#fefce8;">Faltantes <strong style="color:#ca8a04;">${datosProfesor.totalFaltantes}</strong></div>
                    <div class="box" style="border-color:#fca5a5; background:#fef2f2;">Infracciones <strong style="color:#dc2626;">${datosProfesor.totalTramposos}</strong></div>
                </div>

                <h2 class="section-title">2. Rendimiento por Área (Promedio General Base 10)</h2>
                <table>
                    <tr><th>Área de Conocimiento</th><th>Promedio Calculado</th></tr>
                    <tr><td>Ciencias Sociales</td><td>${datosStats.promedios.sociales}</td></tr>
                    <tr><td>Ciencias Exactas</td><td>${datosStats.promedios.exactas}</td></tr>
                    <tr><td>Ciencias Experimentales</td><td>${datosStats.promedios.experimentales}</td></tr>
                </table>

                ${crearTablaGlobal([...datosStats.rendimientoMaterias].reverse(), '3. Áreas Fuertes (Mejores Materias)')}
                ${crearTablaGlobal(datosStats.rendimientoTemas, '4. Focos Rojos (Peores Temas)')}
                ${crearTablaGlobal(datosStats.rendimientoSubtemas, '5. Precisión Crítica (Peores Subtemas)')}

                <h2 class="section-title" style="color:#ca8a04;">6. Alumnos con Exámenes Faltantes</h2>
                ${faltantesHTML}

                <h2 class="section-title" style="color:#dc2626;">7. Reporte de Infracciones y Fraudes</h2>
                ${trampososHTML}
            </body>
            </html>
        `;
        ventanaImpresion.document.write(htmlDocument);
        ventanaImpresion.document.close();
        ventanaImpresion.focus();
        setTimeout(() => { ventanaImpresion.print(); ventanaImpresion.close(); }, 500);
    });

    // ========================================================
    // BÚSQUEDA INDIVIDUAL Y PDF
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
            btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            resUI.classList.add('hidden');
            document.getElementById('tablasIndividualUI')?.classList.add('hidden');
            
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

            const uiTablas = document.getElementById('tablasIndividualUI');
            if(uiTablas) {
                uiTablas.classList.remove('hidden');
                const fuertes = [...data.materias].reverse().slice(0, 5);
                const debiles = [...data.materias].slice(0, 5);

                document.getElementById('tbodyFortalezas').innerHTML = fuertes.map(m => `
                    <tr class="border-b"><td class="py-2">${m.nombre}</td><td class="py-2 text-green-600 font-bold">${m.aciertos}/${m.total}</td></tr>
                `).join('');
                document.getElementById('tbodyDebilidades').innerHTML = debiles.map(m => `
                    <tr class="border-b"><td class="py-2">${m.nombre}</td><td class="py-2 text-red-600 font-bold">${m.aciertos}/${m.total}</td></tr>
                `).join('');
            }

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
        
        // Creador de tablas genérico para Aciertos (Ej: 6/12)
        const crearTablaAciertos = (arreglo, titulo) => {
            if (!arreglo || arreglo.length === 0) return '';
            let html = `<h2 class="section-title">${titulo}</h2><table><tr><th>Nombre</th><th>Aciertos</th></tr>`;
            arreglo.forEach(item => {
                html += `<tr><td>${item.nombre}</td><td style="font-weight:bold;">${item.aciertos} / ${item.total}</td></tr>`;
            });
            return html + '</table>';
        };

        const htmlDocument = `
            <html>
            <head>
                <title>Acuse Individual - ${d.boleta}</title>
                <style>
                    body { font-family: 'Helvetica', Arial, sans-serif; color: #333; padding: 30px; }
                    .header { border-bottom: 3px solid #6c1d45; padding-bottom: 18px; margin-bottom: 25px; }
                    .header h1 { color: #6c1d45; margin: 0; font-size: 20px; text-transform: uppercase; }
                    .subtitle { color: #555; font-size: 12px; margin-top: 5px; }
                    .section-title { font-size: 16px; color: #6c1d45; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px;}
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th { background-color: #f3f4f6; color: #333; padding: 8px; text-align: left; border: 1px solid #ddd;}
                    td { padding: 8px; border: 1px solid #ddd; }
                    .anulado { color: white; background: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight:bold;}
                    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px;}
                    .student-info { background: #f9fafb; padding: 13px; border-left: 4px solid #6c1d45; margin-bottom: 15px;}
                </style>
            </head>
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

                <h2 class="section-title">1. Calificaciones por Área (Base 10)</h2>
                <table>
                    <tr><th>Área de Conocimiento</th><th>Calificación Obtenida</th></tr>
                    <tr><td>Ciencias Sociales</td><td>${d.areas.sociales.calificacion} ${d.areas.sociales.anulado ? '<span class="anulado">ANULADO</span>' : ''}</td></tr>
                    <tr><td>Ciencias Exactas</td><td>${d.areas.exactas.calificacion} ${d.areas.exactas.anulado ? '<span class="anulado">ANULADO</span>' : ''}</td></tr>
                    <tr><td>Ciencias Experimentales</td><td>${d.areas.experimentales.calificacion} ${d.areas.experimentales.anulado ? '<span class="anulado">ANULADO</span>' : ''}</td></tr>
                </table>

                ${crearTablaAciertos([...d.materias].reverse(), '2. Desglose General (Por Materia)')}
                ${crearTablaAciertos([...d.temas].reverse(), '3. Desglose Detallado (Por Tema)')}
                ${crearTablaAciertos([...d.subtemas].reverse(), '4. Precisión Específica (Por Subtema)')}

                <div class="footer">
                    Documento de carácter diagnóstico generado por el Sistema PoliAprende.<br>
                    Fecha de emisión: ${new Date().toLocaleString()}
                </div>
            </body>
            </html>
        `;
        ventanaImpresion.document.write(htmlDocument);
        ventanaImpresion.document.close();
        ventanaImpresion.focus();
        setTimeout(() => { ventanaImpresion.print(); ventanaImpresion.close(); }, 500);
    });
});