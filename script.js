// script.js
const totalMesas = 12;
let mesaSeleccionada = null;
const mesasReservadas = new Set();

const mesaGrid = document.getElementById("mesaGrid");
for (let i = 1; i <= totalMesas; i++) {
  const btn = document.createElement("button");
  btn.className = "mesa";
  btn.id = `mesa${i}`;
  btn.onclick = () => seleccionarMesa(i);
  mesaGrid.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha");
  const hoy = new Date().toISOString().split("T")[0];
  fechaInput.min = hoy;
});

function seleccionarMesa(num) {
  if (mesasReservadas.has(num)) return;
  if (mesaSeleccionada !== null) {
    document.getElementById(`mesa${mesaSeleccionada}`).classList.remove("seleccionada");
  }
  mesaSeleccionada = num;
  document.getElementById(`mesa${num}`).classList.add("seleccionada");
}

function mostrarFormulario() {
  if (!mesaSeleccionada) {
    alert("Por favor selecciona una mesa primero.");
    return;
  }
  document.getElementById("formulario").style.display = "block";
}

function validarCorreo(correo) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}


function finalizarReserva() {
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const personas = document.getElementById("personas").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  if (!nombre || !telefono || !correo || !fecha || !hora) {
    alert("Por favor completa todos los campos.");
    return;
  }

  if (!validarCorreo(correo)) {
    alert("Correo inválido.");
    return;
  }

  const now = new Date();
  const fechaHoraReserva = new Date(`${fecha}T${hora}`);
  if (fechaHoraReserva < now) {
    alert("Selecciona una hora futura.");
    return;
  }

  const mesaId = mesaSeleccionada;
  mesasReservadas.add(mesaId);

  document.getElementById(`mesa${mesaId}`).classList.add("ocupada");
  document.getElementById(`mesa${mesaId}`).classList.remove("seleccionada");

  emailjs.send("service_br9m8mm", "template_y5ys1u4", {
    nombre: nombre,
    telefono: telefono,
    correo: correo,
    personas: personas,
    fecha: fecha,
    hora: hora,
    mesa: mesaId,
    to_email: correo
  }).then(function(response) {
    console.log("Correo enviado:", response.status, response.text);
    document.getElementById("mensajeConfirmacion").innerText =
      `¡Reserva confirmada para el ${fecha} a las ${hora} en la mesa ${mesaId}!`;
  }, function(error) {
    console.error("Error al enviar el correo:", error);
    document.getElementById("mensajeConfirmacion").innerText =
      "Ocurrió un error al enviar el correo. Intenta nuevamente.";
  });

  // Limpiar formulario
  document.getElementById("nombre").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("fecha").value = "";
  document.getElementById("hora").value = "";
  document.getElementById("formulario").style.display = "none";
  mesaSeleccionada = null;

  // Liberar la mesa automáticamente después de 1 minuto
const ahora = new Date();
const reservaTime = new Date(`${fecha}T${hora}`);
const delayLiberacion = reservaTime.getTime() - ahora.getTime() + (30 * 60 * 1000); // 30 minutos después de la hora de reserva

setTimeout(() => {
  if (mesasReservadas.has(mesaId)) {
    mesasReservadas.delete(mesaId);
    document.getElementById(`mesa${mesaId}`).classList.remove("ocupada");
    document.getElementById("mensajeConfirmacion").innerText =
      `La mesa ${mesaId} ha sido liberada automáticamente.`;
  }
}, delayLiberacion);
}