/*
* ============================================================
* ARCHIVO: reactivos_exactos.js
* ============================================================
*/
const reactivosExactos = [
    {
        id_reactivo: 1,
        materia: "Razonamiento Matemático",
        pregunta: "Una llave se abre 4 horas diarias, durante 5 días vierte 5200 litros de agua. ¿Cuántos litros verterá en 12 días, si se abre 4 horas por día?",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "12,470 lts" },
            { letra: "B", texto: "12,480 lts" },
            { letra: "C", texto: "12,490 lts" },
            { letra: "D", texto: "12,500 lts" } 
        ]
    },
    {
        id_reactivo: 2,
        materia: "Razonamiento Matemático",
        pregunta: "¿Qué números deben colocarse para completar la serie?",
        imagen_pregunta: "../img/razonamiento Matemático/reactivo2.PNG",
        opciones: [
            { letra: "A", texto: "6a, 6b" },
            { letra: "B", texto: "6a, 4b" },
            { letra: "C", texto: "4a, 6b" },
            { letra: "D", texto: "4a, 4b" } 
        ]
    },
    {
        id_reactivo: 3,
        materia: "Razonamiento Matemático",
        pregunta: "Clemencia obtuvo ___ de volumen, en la siguiente figura, si el ancho y la altura de cada bloque tiene una unidad y de largo dos unidades.",
        imagen_pregunta: "../img/razonamiento Matemático/reactivo3.PNG",
        opciones: [
            { letra: "A", texto: "38𝑐𝑚<sup>3</sup>" },
            { letra: "B", texto: "40𝑐𝑚<sup>3</sup>" },
            { letra: "C", texto: "42𝑐𝑚<sup>3</sup>" },
            { letra: "D", texto: "44𝑐m<sup>3</sup>" } 
        ]
    },
    {
        id_reactivo: 4,
        materia: "Razonamiento Matemático",
        pregunta: "El número de triángulos que hay en la siguiente figura es:",
        imagen_pregunta: "../img/razonamiento Matemático/reactivo4.PNG",
        opciones: [
            { letra: "A", texto: "6" },
            { letra: "B", texto: "8" },
            { letra: "C", texto: "9" },
            { letra: "D", texto: "10" } 
        ]
    },
    {
        id_reactivo: 5,
        materia: "Razonamiento Matemático",
        pregunta: "Relaciona las figuras planas con la fórmula para obtener su área:",
        imagen_pregunta: "../img/razonamiento Matemático/reactivo5.png",
        opciones: [
            { letra: "A", texto: "1c, 2a, 3b, 4d" },
            { letra: "B", texto: "1d, 2b, 3c, 4a" },
            { letra: "C", texto: "1b, 2a, 3d, 4c" },
            { letra: "D", texto: "1d, 2a, 3b, 4c" } 
        ]
    },
    {
        id_reactivo: 6,
        materia: "Razonamiento Matemático",
        pregunta: "¿Cuál es el diseño de la segunda figura en la secuencia?",
        imagen_pregunta: "../img/razonamiento Matemático/reactivo6.PNG",
        opciones: [
            { letra: "A", texto: "Figura A", imagen: "../img/razonamiento Matemático/reactivo6a.png" },
            { letra: "B", texto: "Figura B", imagen: "../img/razonamiento Matemático/reactivo6b.png" },
            { letra: "C", texto: "Figura C", imagen: "../img/razonamiento Matemático/reactivo6c.png" },
            { letra: "D", texto: "Figura D", imagen: "../img/razonamiento Matemático/reactivo6d.png" },
        ]
    },
    {
        id_reactivo: 7,
        materia: "Razonamiento Matemático",
        pregunta: "El____ es la rama de la matemática que estudia la combinación de elementos como números letras y signos. La ____ estudia las propiedades de las líneas, planos, ángulos.",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "álgebra - geometría" },
            { letra: "B", texto: "álgebra - cálculo" },
            { letra: "C", texto: "geometría - álgebra" },
            { letra: "D", texto: "geometría - cálculo" } 
        ]
    },
    {
        id_reactivo: 8,
        materia: "Razonamiento Matemático",
        pregunta: "Relaciona la variable x, y, z con el número de cuadrados que contienen algunos de los términos de la siguiente sucesión.",
        imagen_pregunta: "../img/razonamiento Matemático/reactivo8.png",
        opciones: [
            { letra: "A", texto: "1𝑏, 2𝑐, 3𝑎" },
            { letra: "B", texto: "1𝑏, 2𝑎, 3𝑑" },
            { letra: "C", texto: "1𝑎, 2𝑑, 3𝑐" },
            { letra: "D", texto: "1𝑐, 2𝑏, 3𝑑" },
        ]
    },
    {
        id_reactivo: 9,
        materia: "Razonamiento Matemático",
        pregunta: "En la siguiente serie de números 1, 2, 5, _____, 677. ¿Cuál es el que falta?",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "24" },
            { letra: "B", texto: "25" },
            { letra: "C", texto: "26" },
            { letra: "D", texto: "27" } 
        ]
    },
    {
        id_reactivo: 10,
        materia: "Razonamiento Matemático",
        pregunta: "Encuentra los números que completan la sucesión 9, 5, 1, ___, -7, ___, -15,...",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "-1, -9" },
            { letra: "B", texto: "-2, -10" },
            { letra: "C", texto: "-3, -11" },
            { letra: "D", texto: "-4, -12" } 
        ]
    },
    {
        id_reactivo: 11,
        materia: "Razonamiento Matemático",
        pregunta: "Relaciona los resultados con su fracción equivalente.",
        imagen_pregunta: "../img/razonamiento Matemático/reactivo11.png",
        opciones: [
            { letra: "A", texto: "1a, 2b, 3c, 4d" },
            { letra: "B", texto: "1d, 2a, 3c, 4b" },
            { letra: "C", texto: "1c, 2d, 3b, 4a" },
            { letra: "D", texto: "1b, 2a, 3d, 4c" } 
        ]
    },
    {
        id_reactivo: 12,
        materia: "Razonamiento Matemático",
        pregunta: "¿Cuál es el diseño de la segunda figura en la secuencia?",
        imagen_pregunta: "../img/razonamiento Matemático/reactivo12.PNG",
        opciones: [
            { letra: "A", texto: "Figura A", imagen: "../img/razonamiento Matemático/reactivo12a.png" },
            { letra: "B", texto: "Figura B", imagen: "../img/razonamiento Matemático/reactivo12b.png" },
            { letra: "C", texto: "Figura C", imagen: "../img/razonamiento Matemático/reactivo12c.png" },
            { letra: "D", texto: "Figura D", imagen: "../img/razonamiento Matemático/reactivo12d.png" },
        ]
    },
    {
        id_reactivo: 13,
        materia: "Matemáticas",
        pregunta: "Paulina mete en una bolsa 15 canicas blancas, 7 rojas, 5 negras, 12 amarillas y 11 azules. Ordena de menor a mayor los eventos de acuerdo con la probabilidad de que al extraer una canica esta sea:",
        imagen_pregunta: "../img/matemáticas/reactivo13.png",
        opciones: [
            { letra: "A", texto: "1, 2, 4, 3", },
            { letra: "B", texto: "2, 1, 3, 4", },
            { letra: "C", texto: "3, 4, 2, 1", },
            { letra: "D", texto: "4, 3, 1, 2", },
        ]
    },
    {
        id_reactivo: 14,
        materia: "Matemáticas",
        pregunta: "Selecciona las expresiones que son equivalentes a 6𝑥 − 2𝑥𝑦 − 𝑦 + 3",
        imagen_pregunta: "../img/matemáticas/reactivo14.png",
        opciones: [
            { letra: "A", texto: "1, 2, 5", },
            { letra: "B", texto: "1, 2, 4", },
            { letra: "C", texto: "2, 3, 4", },
            { letra: "D", texto: "2, 4, 5", },
        ]
    },
    {
        id_reactivo: 15,
        materia: "Matemáticas",
        pregunta: "Dos triángulos son _______ cuando la medida de sus _______ y _______ son iguales.",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "semejantes - ángulos - vértices", },
            { letra: "B", texto: "idénticos - aristas - áreas", },
            { letra: "C", texto: "simétricos - ejes - medidas", },
            { letra: "D", texto: "congruentes - lados – ángulos", },
        ]
    },
    {
        id_reactivo: 16,
        materia: "Matemáticas",
        pregunta: "Relaciona la gráfica de las funciones con su constante de proporcionalidad.",
        imagen_pregunta: "../img/matemáticas/reactivo16.png",
        opciones: [
            { letra: "A", texto: "1a, 2c, 3b, 4e", },
            { letra: "B", texto: "1b, 2e, 3a, 4d", },
            { letra: "C", texto: "1c, 2a, 3d, 4b", },
            { letra: "D", texto: "1e, 2b, 3c, 4a", },
        ]
    },
    {
        id_reactivo: 17,
        materia: "Matemáticas",
        pregunta: "Siete peones tardan 35 días en construir una casa. ¿Cuántos días tardarían 5 peones en construir la misma casa?",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "25", },
            { letra: "B", texto: "35", },
            { letra: "C", texto: "42", },
            { letra: "D", texto: "49", },
        ]
    },
    {
        id_reactivo: 18,
        materia: "Matemáticas",
        pregunta: "Relaciona cada triángulo con el nombre que recibe de acuerdo con la medida de sus lados.",
        imagen_pregunta: "../img/matemáticas/reactivo18.png",
        opciones: [
            { letra: "A", texto: "1a, 2c, 3b", },
            { letra: "B", texto: "1b, 2a, 3c", },
            { letra: "C", texto: "1c, 2d, 3a", },
            { letra: "D", texto: "1d, 2b, 3c", },
        ]
    },
    {
        id_reactivo: 19,
        materia: "Matemáticas",
        pregunta: "Juanito el pastelero tiene una nueva receta para un pastel de cajeta con chocolate, y para esto ya preparó varias porciones de harina como se muestra en la figura. Si necesita 1.075 Kg. ¿Qué porciones debe usar para preparar su obra maestra?",
        imagen_pregunta: "../img/matemáticas/reactivo19.png",
        opciones: [
            { letra: "A", texto: "1, 2, 3", },
            { letra: "B", texto: "2, 4, 7", },
            { letra: "C", texto: "3, 4, 5", },
            { letra: "D", texto: "3, 5, 6", },
        ]
    },
    {
        id_reactivo: 20,
        materia: "Matemáticas",
        pregunta: "Ordena los pasos para convertir un número decimal a fracción.",
        imagen_pregunta: "../img/matemáticas/reactivo20.png",
        opciones: [
            { letra: "A", texto: "2, 3, 1, 4", },
            { letra: "B", texto: "2, 4, 3, 1", },
            { letra: "C", texto: "4, 2, 3, 1", },
            { letra: "D", texto: "4, 1, 2, 3", },
        ]
    },
    {
        id_reactivo: 21,
        materia: "Matemáticas",
        pregunta: "Relaciona el cuerpo geométrico con la fórmula para calcular su volumen.",
        imagen_pregunta: "../img/matemáticas/reactivo21.png",
        opciones: [
            { letra: "A", texto: "1c, 2d, 3a, 4b", },
            { letra: "B", texto: "1c, 2a, 3b, 4d", },
            { letra: "C", texto: "1c, 2d, 3b, 4a", },
            { letra: "D", texto: "1d, 2c, 3b, 4a", },
        ]
    },
    {
        id_reactivo: 22,
        materia: "Matemáticas",
        pregunta: "Selecciona los cuerpos geométricos que son poliedros.",
        imagen_pregunta: "../img/matemáticas/reactivo22.png",
        opciones: [
            { letra: "A", texto: "1, 3, 5, 6", },
            { letra: "B", texto: "2, 3, 5, 7", },
            { letra: "C", texto: "2, 4, 6, 7", },
            { letra: "D", texto: "1, 3, 4, 5", },
        ]
    },
    {
        id_reactivo: 23,
        materia: "Matemáticas",
        pregunta: "Relaciona los triángulos con su característica.",
        imagen_pregunta: "../img/matemáticas/reactivo23.png",
        opciones: [
            { letra: "A", texto: "1a, 2d, 3b, 4c", },
            { letra: "B", texto: "1b, 2c, 3d, 4a", },
            { letra: "C", texto: "1d, 2c, 3a, 4b", },
            { letra: "D", texto: "1c, 2d, 3b, 4a", },
        ]
    },
    {
        id_reactivo: 24,
        materia: "Matemáticas",
        pregunta: "Relacional las expresiones algebraicas, con el término que las convierte en un trinomio cuadrado perfecto.",
        imagen_pregunta: "../img/matemáticas/reactivo24.png",
        opciones: [
            { letra: "A", texto: "1c, 2a, 3b, 4d", },
            { letra: "B", texto: "1a, 2b, 3d, 4c", },
            { letra: "C", texto: "1b, 2d, 3c, 4a", },
            { letra: "D", texto: "1d, 2c, 3a, 4b", },
        ]
    },
    {
        id_reactivo: 25,
        materia: "Física",
        pregunta: "¿Cuál es la propiedad cualitativa de los cuerpos que está relacionada con la energía cinética de sus moléculas?",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "Temperatura", },
            { letra: "B", texto: "Energía", },
            { letra: "C", texto: "Calor", },
            { letra: "D", texto: "Presión", },
        ]
    },
    {
        id_reactivo: 26,
        materia: "Física",
        pregunta: "Selecciona los minerales con los que se puede hacer un imán permanente.",
        imagen_pregunta: "../img/fisica/reactivo26.png",
        opciones: [
            { letra: "A", texto: "1, 3, 4", },
            { letra: "B", texto: "2, 5, 6", },
            { letra: "C", texto: "2, 4, 5", },
            { letra: "D", texto: "3, 5, 6", },
        ]
    },
    {
        id_reactivo: 27,
        materia: "Física",
        pregunta: "Relaciona las propiedades de la luz con sus características.",
        imagen_pregunta: "../img/fisica/reactivo27.png",
        opciones: [
            { letra: "A", texto: "1aef, 2cbd", },
            { letra: "B", texto: "1bcd, 2aef", },
            { letra: "C", texto: "1abd, 2cef", },
            { letra: "D", texto: "1bef, 2acd", },
        ]
    },
    {
        id_reactivo: 28,
        materia: "Física",
        pregunta: "Un atleta del básquetbol alcanzó un salto vertical de pie de 1.25 m. Usando la altura de su salto y el valor de la gravedad 9.8 m/s<sup>2</sup> ¿Cuánto tiempo estuvo en el aire?",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "0.35 s", },
            { letra: "B", texto: "0.50 s", },
            { letra: "C", texto: "0.70 s", },
            { letra: "D", texto: "0.85 s", },
        ]
    },
    {
        id_reactivo: 29,
        materia: "Física",
        pregunta: "Al representar gráficamente la posición frente al tiempo se obtienen líneas curvas (parábolas). La gráfica mostrada representa un movimiento:",
        imagen_pregunta: "../img/fisica/reactivo29.jpg",
        opciones: [
            { letra: "A", texto: "retardado", },
            { letra: "B", texto: "acelerado", },
            { letra: "C", texto: "rectilíneo uniforme", },
            { letra: "D", texto: "caída libre", },
        ]
    },
    {
        id_reactivo: 30,
        materia: "Física",
        pregunta: "Dos cargas, q1 = 1.5 x 10<sup>-6</sup> C y q2 = -2 x 10<sup>-6</sup> C, están separadas como se muestra en la figura. ¿Cuál es la fuerza electrostática entre ellas?",
        imagen_pregunta: "../img/fisica/rectivo30.jpg",
        opciones: [
            { letra: "A", texto: "9.34 x 10<sup>-3</sup> N", },
            { letra: "B", texto: "−9.34 x 10<sup>3</sup> N", },
            { letra: "C", texto: "−9.34 x 10<sup>-3</sup> N", },
            { letra: "D", texto: "9.34 x 10<sup>3</sup> N", },
        ]
    },
    {
        id_reactivo: 31,
        materia: "Física",
        pregunta: "Se lanza una pelota de béisbol con una velocidad inicial de 100 m/s con un ángulo de 30.0° en relación con la horizontal. ¿A qué distancia del punto de lanzamiento alcanzará la pelota su nivel inicial?",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "535 𝑚", },
            { letra: "B", texto: "680 𝑚", },
            { letra: "C", texto: "762 𝑚", },
            { letra: "D", texto: "884 𝑚", },
        ]
    },
    {
        id_reactivo: 32,
        materia: "Física",
        pregunta: "Un automóvil estacionado es un ejemplo de la _______ Ley de Newton y la caída de un objeto hace referencia a la _______ Ley de Newton.",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "tercera - primera", },
            { letra: "B", texto: "segunda - primera", },
            { letra: "C", texto: "segunda - tercera", },
            { letra: "D", texto: "primera - segunda", },
        ]
    },
    {
        id_reactivo: 33,
        materia: "Física",
        pregunta: "Ordena de mayor a menor las siguientes temperaturas:",
        imagen_pregunta: "../img/fisica/reactivo33.png",
        opciones: [
            { letra: "A", texto: "2, 3, 4, 5, 1", },
            { letra: "B", texto: "3, 4, 5, 1, 2", },
            { letra: "C", texto: "2, 3, 5, 1, 4", },
            { letra: "D", texto: "3, 4, 5, 2, 1", },
        ]
    },
    {
        id_reactivo: 34,
        materia: "Física",
        pregunta: "Vincula los tipos de movimiento con los ejemplos de la vida cotidiana.",
        imagen_pregunta: "../img/fisica/reactivo34.png",
        opciones: [
            { letra: "A", texto: "1a, 2b, 3d, 4c", },
            { letra: "B", texto: "1a, 2d, 3b, 4c", },
            { letra: "C", texto: "1b, 2c, 3a, 4d", },
            { letra: "D", texto: "1b, 2c, 3d, 4a", },
        ]
    },
    {
        id_reactivo: 35,
        materia: "Física",
        pregunta: "Es la unidad de la presión en el Sistema Internacional.",
        imagen_pregunta: false,
        opciones: [
            { letra: "A", texto: "Pascal", },
            { letra: "B", texto: "Newton", },
            { letra: "C", texto: "Slug", },
            { letra: "D", texto: "Dina", },
        ]
    },
    {
        id_reactivo: 36,
        materia: "Física",
        pregunta: "Relaciona las características de la onda con el esquema correspondiente.",
        imagen_pregunta: "../img/fisica/reactivo36.png",
        opciones: [
            { letra: "A", texto: "1a, 2b, 3c, 4d", },
            { letra: "B", texto: "1a, 2d, 3b, 4c", },
            { letra: "C", texto: "1b, 2c, 3d, 4a", },
            { letra: "D", texto: "1d, 2a, 3c, 4b", },
        ]
    }

];