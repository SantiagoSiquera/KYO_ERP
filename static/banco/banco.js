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
<select name="rubro[]" class="form-select">
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

valor = valor.replace(",", ".")

let partes = valor.split(".")

if(partes.length > 2){
valor = partes.slice(0,-1).join("") + "." + partes.slice(-1)
}

let numero = Number(valor)

if(!isNaN(numero)){

e.target.dataset.valor = numero

e.target.value = numero.toLocaleString("es-UY",{
minimumFractionDigits:2,
maximumFractionDigits:2
})

}

}, true)


/* ================================
CONVERTIR A NÚMERO REAL
================================ */

function numeroReal(valor){

if(!valor) return 0

valor = String(valor).trim()

valor = valor.replace(/\./g,"").replace(",", ".")

let n = Number(valor)

return isNaN(n) ? 0 : n

}


/* ================================
VALIDAR RUBROS
================================ */

function calcularRubros(){

let total = 0

document.querySelectorAll("input[name='importe[]']").forEach(i=>{

let valor = i.value

total += numeroReal(valor)

})

let montoInput = document.getElementById("montoMovimiento")

let monto = 0

if(montoInput){

let v = montoInput.value

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

const form = e.target

if(!form.action.includes("/movimientos/nuevo/")) return

e.preventDefault()

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

console.error("Error Django:", json)
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

const fila = document.createElement("tr")

fila.innerHTML = `
<td>${m.fecha}</td>
<td>${m.cuenta}</td>
<td>${m.descripcion}</td>
<td>${m.monto.toLocaleString("es-UY",{minimumFractionDigits:2})}</td>
<td>
<select class="form-select form-select-sm">
<option ${m.estado=="Pendiente"?"selected":""}>Pendiente</option>
<option ${m.estado=="Acreditado"?"selected":""}>Acreditado</option>
</select>
</td>
<td>
<button class="btn btn-sm btn-primary">Editar</button>
<button class="btn btn-sm btn-danger">Eliminar</button>
</td>
`

tabla.prepend(fila)

}


function marcarFila(check){

const fila = check.closest("tr")

if(!fila) return

if(check.checked){

fila.style.backgroundColor = "#fff8dc"   // color papel suave

}else{

fila.style.backgroundColor = ""

}

}