function abrirNuevoMovimiento(cuentaId){

fetch("/movimientos/nuevo/?cuenta=" + cuentaId)

.then(res => res.text())

.then(html => {

const contenedor = document.getElementById("contenidoModalMovimiento")

if(!contenedor) return

contenedor.innerHTML = html

const modalElement = document.getElementById("modalMovimiento")

if(!modalElement) return

const modal = new bootstrap.Modal(modalElement)

modal.show()

setTimeout(function(){

aplicarColorTipo()
agregarRubro()
calcularRubros()

},50)

})

}


/* ================================
AGREGAR RUBRO
================================ */

function agregarRubro(){

const tabla = document.getElementById("rubrosBody")

if(!tabla) return

const rubrosOptions = tabla.dataset.rubrosOptions || ""
const proveedoresOptions = tabla.dataset.proveedoresOptions || ""

const fila = document.createElement("tr")

fila.innerHTML = `
<td>
<select name="rubro[]" class="form-select rubro-select">
<option value="">Seleccione rubro</option>
${rubrosOptions}
</select>
</td>

<td>
<select name="proveedor[]" class="form-select proveedor-select" disabled>
<option value="">Proveedor</option>
${proveedoresOptions}
</select>
</td>

<td>
<input type="text" name="importe[]" class="form-control">
</td>

<td>
<button type="button" class="btn btn-sm btn-danger" onclick="this.closest('tr').remove(); calcularRubros()">✕</button>
</td>
`

tabla.appendChild(fila)

calcularRubros()

}


/* ================================
COLOR TIPO INGRESO / EGRESO
================================ */

function aplicarColorTipo(){

const tipo = document.getElementById("tipoMovimiento")

if(!tipo) return

tipo.classList.remove("bg-success","bg-danger","text-white")

if(tipo.value === "INGRESO"){
tipo.classList.add("bg-success","text-white")
}else{
tipo.classList.add("bg-danger","text-white")
}

}

document.addEventListener("change",function(e){

if(e.target.id === "tipoMovimiento"){
aplicarColorTipo()
}

})


/* ================================
FORMATO MONTO
================================ */

document.addEventListener("blur", function(e){

  if(e.target.id !== "montoMovimiento" && e.target.name !== "importe[]") return

  let valor = e.target.value.trim()
  if(valor === "") return

  let numero = numeroReal(valor)

  e.target.dataset.valor = numero

  e.target.value = numero.toLocaleString("es-UY",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  })
  calcularRubros()

}, true)
/* ================================
CONVERTIR A NÚMERO REAL
================================ */

function numeroReal(valor){

    if(valor === null || valor === undefined) return 0

    valor = String(valor).trim()

    if(valor === "") return 0

    // formato latino: 1.234,56
    if(valor.includes(",")){
        valor = valor.replace(/\./g,"").replace(",",".")
    }

    const numero = Number(valor)

    if(isNaN(numero)) return 0

    // redondeo a 2 decimales igual que Decimal.quantize
    return Math.round(numero * 100) / 100

}


/* ================================
VALIDAR RUBROS
================================ */

function calcularRubros(){

let total = 0

document.querySelectorAll("input[name='importe[]']").forEach(i=>{

let valor = i.dataset.valor || i.value
total += numeroReal(valor)

})

let montoInput = document.getElementById("montoMovimiento")

let monto = 0

if(montoInput){
let v = montoInput.dataset.valor || montoInput.value
monto = numeroReal(v)
}

let diferencia = monto - total

document.getElementById("totalRubros").innerText =
total.toLocaleString("es-UY",{minimumFractionDigits:2})

document.getElementById("diferenciaRubros").innerText =
diferencia.toLocaleString("es-UY",{minimumFractionDigits:2})

}

document.addEventListener("input", function(e){

if(e.target.name === "importe[]" || e.target.id === "montoMovimiento"){
calcularRubros()
}

})


/* ================================
VALIDAR ANTES DE GUARDAR
================================ */

document.addEventListener("submit", function(e){

const form = e.target

if(!form.action.includes("/movimientos/nuevo/")) return

const montoInput = document.getElementById("montoMovimiento")

let monto = numeroReal(
montoInput ? (montoInput.dataset.valor || montoInput.value) : 0
)

let total = 0

document.querySelectorAll("input[name='importe[]']").forEach(i=>{
total += numeroReal(i.dataset.valor || i.value)
})

const diferencia = monto - total

if(Math.abs(diferencia) > 0.01){

e.preventDefault()

const montoTxt = monto.toLocaleString("es-UY",{minimumFractionDigits:2})
const totalTxt = total.toLocaleString("es-UY",{minimumFractionDigits:2})

document.getElementById("detalleErrorRubros").innerText =
`Movimiento: ${montoTxt} | Rubros: ${totalTxt}`

const modalError = new bootstrap.Modal(
document.getElementById("modalErrorRubros")
)

modalError.show()

}

})


/* ================================
GUARDAR MOVIMIENTO (AJAX)
================================ */

document.addEventListener("submit", function(e){
    if(e.defaultPrevented) return

const form = e.target

if(!form.action.includes("/movimientos/nuevo/")) return

e.preventDefault()


/* NORMALIZAR DINERO ANTES DE ENVIAR */

const montoInput = document.getElementById("montoMovimiento")

if(montoInput){
  let n = numeroReal(montoInput.dataset.valor || montoInput.value)
  montoInput.value = n.toFixed(2)
}

document.querySelectorAll("#rubrosBody input[name='importe[]']").forEach(i=>{
  let n = numeroReal(i.dataset.valor || i.value)
  i.value = n.toFixed(2)
})

let data = new FormData(form)

fetch(form.action,{
method:"POST",
body:data,
headers:{
"X-Requested-With":"XMLHttpRequest"
}
})
.then(async r => {

const texto = await r.text()

try{

const json = JSON.parse(texto)

if(!r.ok){

console.error("Error Django:", JSON.stringify(json, null, 2))
alert("Error al guardar. Revisa consola.")
return null

}

return json

}catch(err){

console.error("Respuesta no JSON:", texto)
alert("El servidor devolvió HTML. Error en la vista.")
return null

}

})
.then(res=>{

if(!res) return

mostrarToast("Movimiento guardado")

insertarMovimientoTabla(res.movimiento)

form.reset()
const montoInput = document.getElementById("montoMovimiento")
if(montoInput){
    delete montoInput.dataset.valor
}

document.getElementById("rubrosBody").innerHTML=""

agregarRubro()

calcularRubros()

})

})


/* ================================
TOAST
================================ */

function mostrarToast(msg){

let toast = document.createElement("div")

toast.className = "toast-guardado"

toast.innerText = msg

document.body.appendChild(toast)

setTimeout(()=>{
toast.remove()
},2000)

}


/* ================================
INSERTAR MOVIMIENTO EN TABLA
================================ */

function insertarMovimientoTabla(m){

const tabla = document.querySelector("#tablaMovimientos tbody")
if(!tabla) return

const monto = Number(m.monto)

const ingreso = monto > 0
  ? monto.toLocaleString("es-UY",{minimumFractionDigits:2})
  : ""

const egreso = monto < 0
  ? Math.abs(monto).toLocaleString("es-UY",{minimumFractionDigits:2})
  : ""

const fila = document.createElement("tr")

fila.innerHTML = `
<td>${m.fecha}</td>
<td>${m.cuenta}</td>
<td>${m.descripcion}</td>

<td class="text-end text-success">
${ingreso}
</td>

<td class="text-end text-danger">
${egreso}
</td>

<td>
<select class="form-select form-select-sm estado-select">
<option ${m.estado=="Pendiente"?"selected":""}>Pendiente</option>
<option ${m.estado=="Acreditado"?"selected":""}>Acreditado</option>
</select>
</td>

<td class="text-center">
<input type="checkbox" class="check-mov" onclick="marcarFila(this)">
</td>

<td>
<button class="btn btn-sm btn-outline-primary">Editar</button>
<button class="btn btn-sm btn-outline-danger">Eliminar</button>
</td>
`

tabla.prepend(fila)

}

function marcarFila(check){

    const fila = check.closest("tr")
    if(!fila) return

    fila.classList.toggle("fila-conciliada", check.checked)

}

function ordenarTabla(col){

const tabla = document.getElementById("tablaMovimientos")
const tbody = tabla.querySelector("tbody")

const filas = Array.from(tbody.querySelectorAll("tr"))

let asc = tabla.dataset.orden !== "asc"

filas.sort(function(a,b){

let A = a.children[col].innerText.trim()
let B = b.children[col].innerText.trim()

/* detectar fecha */

if(A.match(/\d{2}\/\d{2}\/\d{4}/)){

let pa = A.split("/")
let pb = B.split("/")

let da = new Date(pa[2], pa[1]-1, pa[0])
let db = new Date(pb[2], pb[1]-1, pb[0])

return asc ? da-db : db-da
}

/* detectar numero con miles */

let numA = parseFloat(A.replace(/\./g,"").replace(",","."))
let numB = parseFloat(B.replace(/\./g,"").replace(",","."))
if(!isNaN(numA) && !isNaN(numB)){
return asc ? numA-numB : numB-numA
}

/* texto */

return asc
? A.localeCompare(B)
: B.localeCompare(A)

})

filas.forEach(f => tbody.appendChild(f))

tabla.dataset.orden = asc ? "asc" : "desc"

}

/* ================================
HABILITAR PROVEEDOR SEGUN RUBRO
================================ */

document.addEventListener("change", function(e){

    if(!e.target.classList.contains("rubro-select")) return;

    const fila = e.target.closest("tr");
    if(!fila) return;

    const proveedor = fila.querySelector(".proveedor-select");
    if(!proveedor) return;

    const texto = e.target.options[e.target.selectedIndex].text.toLowerCase();

    if(texto.includes("proveedor")){
        proveedor.disabled = false;
    }else{
        proveedor.disabled = true;
        proveedor.value = "";
    }

});