let model;
let maxPredictions;

let imagenActual = "";
let categoriaDetectada = "Pendiente";

const buscadorObras =
document.getElementById("buscadorObras");

const rankingCategorias =
document.getElementById("rankingCategorias");

const imagenInput = document.getElementById("imagenInput");
const preview = document.getElementById("preview");

const guardarBtn = document.getElementById("guardarBtn");
const analizarBtn = document.getElementById("analizarBtn");

const resultadoIA = document.getElementById("resultadoIA");
const obrasVisitantes = document.getElementById("obrasVisitantes");
const obrasGuardadas =
JSON.parse(localStorage.getItem("obras")) || [];

function mostrarObras() {

    obrasVisitantes.innerHTML = "";

    obrasGuardadas.forEach(obra => {

        obrasVisitantes.innerHTML += `

        <div class="obra-card">

            <img
            src="${obra.imagen}"
            class="imagen-ampliable">

            <div class="obra-info">

                <h5>${obra.autor}</h5>

                <p>
                    Categoría IA:
                    ${obra.categoria}
                </p>

                <p>
                    ${obra.fecha}
                </p>

            </div>

        </div>

        `;
    });

document
.querySelectorAll(".imagen-ampliable")
.forEach(img => {

    img.addEventListener("click", () => {

        document
        .getElementById("imagenModal")
        .src = img.src;

        new bootstrap.Modal(
            document.getElementById("modalImagen")
        ).show();

    });

});

}

function actualizarRanking() {

    const categorias = {};

    obrasGuardadas.forEach(obra => {

        categorias[obra.categoria] =
        (categorias[obra.categoria] || 0) + 1;

    });

    let html = "";

    Object.entries(categorias)
    .sort((a,b)=>b[1]-a[1])
    .forEach(cat => {

        html += `

        <div class="d-flex justify-content-between border p-2 mb-2 rounded">

            <strong>${cat[0]}</strong>

            <span>${cat[1]} obras</span>

        </div>

        `;

    });

    rankingCategorias.innerHTML = html;
}

async function cargarModelo() {

    try {

        const URL = "./ModeloIA/";

        model = await tmImage.load(
            URL + "model.json",
            URL + "metadata.json"
        );

        maxPredictions = model.getTotalClasses();

        console.log("Modelo cargado correctamente");

    } catch (error) {

        console.error(error);

        resultadoIA.innerHTML = `
            <h4>Error</h4>
            <p>No se pudo cargar la IA.</p>
        `;
    }
}

cargarModelo();
mostrarObras();
actualizarRanking();

imagenInput.addEventListener("change", function () {

    const archivo = this.files[0];

    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = function (e) {

        imagenActual = e.target.result;

        categoriaDetectada = "Pendiente";

        resultadoIA.innerHTML = `
            <h4>Categoría detectada</h4>
            <p>Esperando análisis...</p>
        `;

        preview.innerHTML = `
            <img src="${imagenActual}">
        `;
    };

    lector.readAsDataURL(archivo);
});

async function analizarImagen() {

    if (!imagenActual) {

        alert("Selecciona una imagen primero");
        return;
    }

    if (!model) {

        alert("La IA todavía está cargando");
        return;
    }

    const img = new Image();

    img.src = imagenActual;

    await new Promise(resolve => {
        img.onload = resolve;
    });

    const prediction = await model.predict(img);

    prediction.sort(
        (a, b) => b.probability - a.probability
    );

    const mejor = prediction[0];

    categoriaDetectada = mejor.className;

    resultadoIA.innerHTML = `
        <h4>Categoría detectada</h4>

        <p>
            <strong>${mejor.className}</strong>
            (${(mejor.probability * 100).toFixed(1)}%)
        </p>
    `;
}

analizarBtn.addEventListener(
    "click",
    analizarImagen
);

guardarBtn.addEventListener("click", () => {

    const autor =
        document.getElementById("autor").value.trim();

    if (!autor) {

        alert("Escribe tu nombre");
        return;
    }

    if (!imagenActual) {

        alert("Selecciona una imagen");
        return;
    }

    if (categoriaDetectada === "Pendiente") {

        alert("Primero analiza la imagen con la IA");
        return;
    }

    const nuevaObra = {

    autor: autor,

    imagen: imagenActual,

    categoria: categoriaDetectada,

    fecha: new Date().toLocaleString()

};

obrasGuardadas.push(nuevaObra);

localStorage.setItem(
    "obras",
    JSON.stringify(obrasGuardadas)
);

mostrarObras();

    document.getElementById("autor").value = "";

    imagenActual = "";
    categoriaDetectada = "Pendiente";

    preview.innerHTML = `
        <p>Vista previa de la obra</p>
    `;

    resultadoIA.innerHTML = `
        <h4>Categoría detectada</h4>
        <p>Esperando análisis...</p>
    `;
});

document
.getElementById("borrarGaleria")
.addEventListener("click", () => {

    if (!confirm("¿Seguro que deseas borrar todas las obras?")) {
        return;
    }

    localStorage.removeItem("obras");

    location.reload();

});

buscadorObras.addEventListener("input", () => {

    const texto =
    buscadorObras.value.toLowerCase();

    document
    .querySelectorAll(".obra-card")
    .forEach(card => {

        const autor =
        card.querySelector("h5")
        .textContent
        .toLowerCase();

        card.style.display =
        autor.includes(texto)
        ? "block"
        : "none";

    });

});