document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formEstadisticas');
    const btnPDF = document.getElementById('btnPDF');
    
    // Variables para guardar la data y armar el PDF
    let datosStats = null; 
    let datosProfesor = null; 

    // Mes actual por defecto
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('fechaInicio').value = primerDia.toISOString().split('T')[0];
    document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const inputGrupo = document.getElementById('filtroGrupo').value.trim();
        const btnGenerar = document.getElementById('btnGenerar');

        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            alert("La fecha de inicio no puede ser mayor a la final.");
            return;
        }

        try {
            btnGenerar.disabled = true;
            btnGenerar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';

            // 1. Petición de Rendimiento General (Promedios)
            let urlStats = `https://www.bitacora.cecyt14.ipn.mx/api/examen/reporte-estadisticas?`;
            if(fechaInicio) urlStats += `fechaInicio=${fechaInicio}&`;
            if(fechaFin) urlStats += `fechaFin=${fechaFin}`;
            const resStats = await fetch(urlStats);
            
            datosStats = await resStats.json(); 

            if (!resStats.ok) throw new Error(datosStats.error || "Error en estadísticas");

            // 2. Petición de Alumnos y Tramposos (Por Grupo Y Fechas)
            let urlProfesor = `https://www.bitacora.cecyt14.ipn.mx/api/examen/reporte-profesor?`;
            if(fechaInicio) urlProfesor += `fechaInicio=${fechaInicio}&`;
            if(fechaFin) urlProfesor += `fechaFin=${fechaFin}&`;
            if(inputGrupo) urlProfesor += `grupo=${inputGrupo}`;
            const resProfesor = await fetch(urlProfesor);
            
            datosProfesor = await resProfesor.json(); 

            if (!resProfesor.ok) throw new Error(datosProfesor.error || "Error en reporte de profesor");

            pintarDashboard(datosStats, datosProfesor);
            
            // Habilitar botón de PDF
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

    btnPDF.addEventListener('click', generarPDF);

    function pintarDashboard(stats, prof) {
        document.getElementById('panelResultados').classList.remove('hidden');

        // KPIs (Mezclamos datos de ambas peticiones)
        document.getElementById('kpiAlumnos').innerText = prof.totalAlumnosConsultados; 
        document.getElementById('kpiExamenes').innerText = stats.participacion.totalExamenes;
        document.getElementById('kpiCompletos').innerText = stats.participacion.alumnosCompletaronTodo;
        document.getElementById('kpiTramposos').innerText = prof.totalTramposos; 

        // Promedios
        const listaP = document.getElementById('listaPromedios');
        listaP.innerHTML = `
            <li class="flex justify-between items-center bg-gray-50 p-3 rounded"><span class="font-semibold text-gray-700">Ciencias Sociales</span> <span class="font-black text-ipnGuinda">${stats.promedios.sociales}</span></li>
            <li class="flex justify-between items-center bg-gray-50 p-3 rounded"><span class="font-semibold text-gray-700">Ciencias Exactas</span> <span class="font-black text-ipnGuinda">${stats.promedios.exactas}</span></li>
            <li class="flex justify-between items-center bg-gray-50 p-3 rounded"><span class="font-semibold text-gray-700">Cs. Experimentales</span> <span class="font-black text-ipnGuinda">${stats.promedios.experimentales}</span></li>
        `;

        // Puntos débiles para la UI global (solo mostramos las 5 peores aquí para no saturar la pantalla)
        const listaD = document.getElementById('listaDebiles');
        listaD.innerHTML = '';
        if(stats.puntosDebiles.length === 0) {
            listaD.innerHTML = '<li class="text-gray-500 italic">No hay datos suficientes.</li>';
        } else {
            const soloDebilesUI = [...stats.puntosDebiles].sort((a, b) => a.porcentaje - b.porcentaje).slice(0, 5);
            soloDebilesUI.forEach((item, index) => {
                listaD.innerHTML += `
                    <li class="flex justify-between items-center">
                        <span class="text-gray-700 text-sm"><span class="font-bold text-red-500 mr-2">#${index+1}</span> ${item.materia}</span>
                        <span class="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">${item.porcentaje}% Acierto</span>
                    </li>
                `;
            });
        }
    }

    function generarPDF() {
        if(!datosStats || !datosProfesor) return;

        const ventanaImpresion = window.open('', '', 'height=800,width=800');
        
        // --- CÁLCULO DE FORTALEZAS Y DEBILIDADES GLOBALES ---
        const filasPuntosFuertesGlobal = [...datosStats.puntosDebiles]
            .sort((a, b) => b.porcentaje - a.porcentaje)
            .slice(0, 5)
            .map((m, i) => `<tr><td>${i+1}</td><td>${m.materia}</td><td style="color:green; font-weight:bold;">${m.porcentaje}%</td></tr>`)
            .join('');

        const filasPuntosDebilesGlobal = [...datosStats.puntosDebiles]
            .sort((a, b) => a.porcentaje - b.porcentaje)
            .slice(0, 5)
            .map((m, i) => `<tr><td>${i+1}</td><td>${m.materia}</td><td style="color:red; font-weight:bold;">${m.porcentaje}%</td></tr>`)
            .join('');

        // ==========================================
        // NUEVA TABLA: LISTA NEGRA DE TRAMPOSOS
        // ==========================================
        let listaNegraHTML = '';
        if (datosProfesor.listaTramposos.length === 0) {
            listaNegraHTML = '<p style="color: green; font-weight: bold; text-align: center; margin-top:20px;">✓ No se detectaron infracciones de seguridad en esta consulta.</p>';
        } else {
            listaNegraHTML = `
                <table style="margin-top: 15px;">
                    <tr style="background-color: #dc2626;"><th style="background-color: #dc2626;">Boleta</th><th style="background-color: #dc2626;">Nombre / Correo</th><th style="background-color: #dc2626;">Grupo</th><th style="background-color: #dc2626;">Exámenes Anulados</th></tr>`;
            
            datosProfesor.listaTramposos.forEach(t => {
                listaNegraHTML += `
                    <tr>
                        <td style="font-weight:bold;">${t.boleta}</td>
                        <td>${t.correo || t.curp}</td>
                        <td style="text-align:center;">${t.grupo}</td>
                        <td style="color: #dc2626; font-size:12px;">${t.examenesAnulados.join(', ').toUpperCase()}</td>
                    </tr>`;
            });
            listaNegraHTML += `</table>`;
        }

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
                    .grid { display: flex; justify-content: space-between; margin-top: 15px; }
                    .box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; width: 22%; text-align: center; border-radius: 8px;}
                    .box strong { display: block; font-size: 24px; color: #333; margin-top: 10px;}
                    .box-red { border-color: #fca5a5; background: #fef2f2;}
                    .box-red strong { color: #dc2626;}
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
                    th { background-color: #6c1d45; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #eee; }
                    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px;}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reporte Grupal - Simulador de Inducción</h1>
                    <div class="subtitle">CECyT 14 "Luis Enrique Erro" - UDI</div>
                    <div class="subtitle" style="margin-top:10px; font-size:16px;">
                        <strong>Filtro Aplicado:</strong> ${datosProfesor.filtroGrupo} 
                    </div>
                </div>

                <h2 class="section-title">1. Resumen de Participación</h2>
                <div class="grid">
                    <div class="box">Alumnos Evaluados <strong>${datosProfesor.totalAlumnosConsultados}</strong></div>
                    <div class="box">Total de Exámenes <strong>${datosStats.participacion.totalExamenes}</strong></div>
                    <div class="box">Módulos Completos <strong>${datosStats.participacion.alumnosCompletaronTodo}</strong></div>
                    <div class="box box-red">Infracciones (Fraudes) <strong>${datosProfesor.totalTramposos}</strong></div>
                </div>

                <h2 class="section-title">2. Rendimiento por Área (Promedio General Base 10)</h2>
                <table>
                    <tr><th>Área de Conocimiento</th><th>Promedio Calculado</th></tr>
                    <tr><td>Ciencias Sociales</td><td>${datosStats.promedios.sociales}</td></tr>
                    <tr><td>Ciencias Exactas</td><td>${datosStats.promedios.exactas}</td></tr>
                    <tr><td>Ciencias Experimentales</td><td>${datosStats.promedios.experimentales}</td></tr>
                </table>

                <h2 class="section-title" style="color: #15803d;">3. Fortalezas Académicas (Top 5 del Grupo)</h2>
                <table>
                    <tr><th>#</th><th>Materia</th><th>Porcentaje de Acierto</th></tr>
                    ${filasPuntosFuertesGlobal || '<tr><td colspan="3">Sin datos suficientes.</td></tr>'}
                </table>

                <h2 class="section-title" style="color: #d32f2f;">4. Focos Rojos (Materias de Bajo Rendimiento)</h2>
                <table>
                    <tr><th>#</th><th>Materia</th><th>Porcentaje de Acierto</th></tr>
                    ${filasPuntosDebilesGlobal || '<tr><td colspan="3">Sin datos suficientes.</td></tr>'}
                </table>

                <h2 class="section-title" style="color: #dc2626;">5. Reporte de Incidencias y Fraudes</h2>
                <p style="font-size:12px; color:#555;">Lista de alumnos a los que se les anuló uno o más exámenes por salir de la pantalla completa (abandono de ventana de seguridad).</p>
                ${listaNegraHTML}

                <div class="footer">
                    Generado automáticamente.<br>
                    Fecha de impresión: ${new Date().toLocaleString()}
                </div>
            </body>
            </html>
        `;

        ventanaImpresion.document.write(htmlDocument);
        ventanaImpresion.document.close();
        ventanaImpresion.focus();

        setTimeout(() => {
            ventanaImpresion.print();
            ventanaImpresion.close();
        }, 500);
    }
});

// ========================================================
// LOGICA PARA BÚSQUEDA Y REPORTE INDIVIDUAL
// ========================================================
const formIndividual = document.getElementById('formIndividual');
const btnPDFIndividual = document.getElementById('btnPDFIndividual');
let datosAlumnoActual = null;

formIndividual.addEventListener('submit', async (e) => {
    e.preventDefault();
    const boleta = document.getElementById('inputBoleta').value.trim();
    const btnBuscar = document.getElementById('btnBuscarAlumno');
    const resUI = document.getElementById('resIndividualUI');
    const txtInfo = document.getElementById('txtAlumnoEncontrado');

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
        
        // Mostrar éxito en UI
        txtInfo.innerText = `Boleta: ${data.boleta} | CURP: ${data.curp}`;
        resUI.classList.remove('hidden');

        // --- LLENAR TABLAS INDIVIDUALES EN PANTALLA ---
        const uiTablas = document.getElementById('tablasIndividualUI');
        if(uiTablas) {
            uiTablas.classList.remove('hidden');
            
            const fortalezas = [...data.puntosDebiles].sort((a, b) => b.porcentaje - a.porcentaje).slice(0, 5);
            const debilidades = [...data.puntosDebiles].sort((a, b) => a.porcentaje - b.porcentaje).slice(0, 5);

            document.getElementById('tbodyFortalezas').innerHTML = fortalezas.map(m => `
                <tr class="border-b">
                    <td class="py-2">${m.materia}</td>
                    <td class="py-2 text-green-600 font-bold">${m.porcentaje.toFixed(1)}%</td>
                </tr>
            `).join('');

            document.getElementById('tbodyDebilidades').innerHTML = debilidades.map(m => `
                <tr class="border-b">
                    <td class="py-2">${m.materia}</td>
                    <td class="py-2 text-red-600 font-bold">${m.porcentaje.toFixed(1)}%</td>
                </tr>
            `).join('');
        }
        // ----------------------------------------------

        // Habilitar botón PDF
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
    
    // --- CÁLCULO PARA EL PDF INDIVIDUAL ---
    const filasFuertes = [...d.puntosDebiles]
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 5)
        .map((m, i) => `<tr><td>${i+1}</td><td>${m.materia}</td><td style="color:green; font-weight:bold;">${m.porcentaje.toFixed(1)}%</td></tr>`)
        .join('');

    const filasDebiles = [...d.puntosDebiles]
        .sort((a, b) => a.porcentaje - b.porcentaje)
        .slice(0, 5)
        .map((m, i) => `<tr><td>${i+1}</td><td>${m.materia}</td><td style="color:red; font-weight:bold;">${m.porcentaje.toFixed(1)}%</td></tr>`)
        .join('');

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
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                th { background-color: #f3f4f6; color: #333; padding: 10px; text-align: left; border: 1px solid #ddd;}
                td { padding: 10px; border: 1px solid #ddd; }
                .anulado { color: white; background: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight:bold;}
                .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px;}
                .student-info { background: #f9fafb; padding: 13px; border-left: 4px solid #6c1d45; margin-bottom: 15px;}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Acuse de Resultados Individual</h1>
                <div class="subtitle">Simulador de Examen de Inducción | CECyT 14</div>
            </div>

            <div class="student-info">
                <strong>Boleta:</strong> ${d.boleta} <br>
                <strong>CURP:</strong> ${d.curp}
            </div>

            <h2 class="section-title">1. Calificaciones por Área (Base 10)</h2>
            <table>
                <tr><th>Área</th><th>Calificación Obtenida</th></tr>
                <tr>
                    <td>Ciencias Sociales</td>
                    <td>${d.areas.sociales.calificacion} ${d.areas.sociales.anulado ? '<span class="anulado">ANULADO POR TRAMPA</span>' : ''}</td>
                </tr>
                <tr>
                    <td>Ciencias Exactas</td>
                    <td>${d.areas.exactas.calificacion} ${d.areas.exactas.anulado ? '<span class="anulado">ANULADO POR TRAMPA</span>' : ''}</td>
                </tr>
                <tr>
                    <td>Ciencias Experimentales</td>
                    <td>${d.areas.experimentales.calificacion} ${d.areas.experimentales.anulado ? '<span class="anulado">ANULADO POR TRAMPA</span>' : ''}</td>
                </tr>
            </table>

            <h2 class="section-title" style="color: #15803d;">2. Fortalezas Académicas (Top 5)</h2>
            <p style="font-size: 13px; color: #666;">Materias con mayor porcentaje de acierto del estudiante:</p>
            <table>
                <tr><th>#</th><th>Materia</th><th>Porcentaje de Acierto</th></tr>
                ${filasFuertes || '<tr><td colspan="3">No hay datos suficientes registrados.</td></tr>'}
            </table>

            <h2 class="section-title" style="color: #d32f2f;">3. Áreas de Oportunidad (A Mejorar)</h2>
            <p style="font-size: 13px; color: #666;">Materias con menor porcentaje de acierto del estudiante:</p>
            <table>
                <tr><th>#</th><th>Materia</th><th>Porcentaje de Acierto</th></tr>
                ${filasDebiles || '<tr><td colspan="3">No hay datos suficientes registrados.</td></tr>'}
            </table>

            <div class="footer">
                Documento de carácter informativo generado por el Sistema PoliAprende.<br>
                Fecha de emisión: ${new Date().toLocaleString()}
            </div>
        </body>
        </html>
    `;

    ventanaImpresion.document.write(htmlDocument);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 500);
});