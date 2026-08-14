// SCRIPT: Menú Hamburguesa Responsivo
document.addEventListener('DOMContentLoaded', function() {
    
    // Verificamos si existe la barra para evitar errores en otras páginas
    const logoBarra = document.querySelector('.logo-barra');
    const nav = document.querySelector('.nav');

    if (logoBarra && nav) {
        // 1. Crear el botón de menú
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle focus:outline-none';
        menuToggle.innerHTML = '☰';
        menuToggle.setAttribute('aria-label', 'Menú');
        
        // Insertar el botón de menú justo después del logo
        logoBarra.appendChild(menuToggle);
        
        // 2. Mostrar/ocultar menú al hacer clic
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.setAttribute(
                'aria-expanded', 
                nav.classList.contains('active') ? 'true' : 'false'
            );
        });
        
        // 3. Cerrar menú al hacer clic en un enlace (solo en móvil)
        document.querySelectorAll('.nav a, .nav button').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    nav.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
        
        // 4. Actualizar visibilidad del menú al cambiar tamaño de pantalla
        function handleResize() {
            if (window.innerWidth > 768) {
                // En escritorio, asegurarnos de que active esté presente o el CSS lo maneje
                nav.classList.remove('active'); // Limpiamos para evitar conflictos
                if(menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
            } else {
                nav.classList.remove('active');
            }
        }
        
        // Ejecutar al cargar y al redimensionar
        window.addEventListener('resize', handleResize);
        handleResize();
    }
});