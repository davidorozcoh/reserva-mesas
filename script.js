const totalMesas = 12;
let mesaSeleccionada = null;
const mesasReservadas = new Set();

document.addEventListener("DOMContentLoaded", () => {
  generarMapaDeMesas();
  configurarFechaMinima();
  cargarReservasDesdeFirebase();
});

// 🟩 Generar el mapa de mesas dinámicamente
function generarMapaDeMesas() {
  const mesaGrid = document.getElementById("mesaGrid");
  for (let i = 1; i <= totalMesas; i++) {
    const btn = document.createElement("button");
    btn.className = "mesa";
    btn.id = `mesa${i}`;

    // Agregamos el número de la mesa como un 'span'
    const numero = document.createElement("span");
    numero.textContent = i;

    // Agregar el 'span' al 'button'
    btn.appendChild(numero);

    btn.onclick = () => seleccionarMesa(i);
    mesaGrid.appendChild(btn);
  }
}

// 🟨 Configura el mínimo de fecha en el input
function configurarFechaMinima() {
  const fechaInput = document.getElementById("fecha");
  const hoy = new Date().toISOString().split("T")[0];
  fechaInput.min = hoy;
}

// 🟧 Cargar reservas existentes desde Firebase
function cargarReservasDesdeFirebase() {
  firebase.database().ref('reservas').once('value', snapshot => {
    const reservas = snapshot.val();
    if (reservas) {
      Object.keys(reservas).forEach(mesa => {
        const mesaNum = mesa.replace('mesa', '');
        mesasReservadas.add(Number(mesaNum));
        const btn = document.getElementById(`mesa${mesaNum}`);
        if (btn) btn.classList.add("ocupada");
      });
    }
  });
}

// 🟥 Selección de mesa
function seleccionarMesa(num) {
  if (mesasReservadas.has(num)) return;

  if (mesaSeleccionada !== null) {
    document.getElementById(`mesa${mesaSeleccionada}`).classList.remove("seleccionada");
  }

  mesaSeleccionada = num;
  document.getElementById(`mesa${num}`).classList.add("seleccionada");
}

// 🔵 Mostrar el formulario de reserva
function mostrarFormulario() {
  if (!mesaSeleccionada) {
    alert("Por favor selecciona una mesa primero.");
    return;
  }
  document.getElementById("formulario").style.display = "block";
}

// 🟣 Validar formato de correo
function validarCorreo(correo) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

// 🟠 Finalizar reserva
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

  // ✉️ Enviar correo de confirmación
  emailjs.send("service_br9m8mm", "template_y5ys1u4", {
    nombre,
    telefono,
    correo,
    personas,
    fecha,
    hora,
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

  // 🔐 Guardar en Firebase
  firebase.database().ref(`reservas/${fecha}/${hora}/mesa${mesaId}`).set({
    fecha,
    hora,
    nombre,
    correo,
    telefono,
    personas
  });

  firebase.database().ref('reservas').once('value', snapshot => {
    const reservas = snapshot.val();
    if (reservas) {
      const ahora = new Date();
  
      Object.entries(reservas).forEach(([mesaKey, reserva]) => {
        const fechaReserva = new Date(`${reserva.fecha}T${reserva.hora}`);
  
        // Bloqueamos la mesa solo si la reserva es para el futuro
        if (fechaReserva > ahora) {
          const mesaNum = mesaKey.replace('mesa', '');
          mesasReservadas.add(Number(mesaNum));
          const btn = document.getElementById(`mesa${mesaNum}`);
          if (btn) btn.classList.add("ocupada");
        }
      });
    }
  });  

  // 🧹 Limpiar formulario
  document.getElementById("nombre").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("fecha").value = "";
  document.getElementById("hora").value = "";
  document.getElementById("formulario").style.display = "none";
  mesaSeleccionada = null;

  // ⏳ Liberar mesa automáticamente 30 minutos después de la hora reservada
  const ahora = new Date();
  const reservaTime = new Date(`${fecha}T${hora}`);
  const delayLiberacion = reservaTime.getTime() - ahora.getTime() + (30 * 60 * 1000);

  setTimeout(() => {
    if (mesasReservadas.has(mesaId)) {
      mesasReservadas.delete(mesaId);
      document.getElementById(`mesa${mesaId}`).classList.remove("ocupada");
      document.getElementById("mensajeConfirmacion").innerText =
        `La mesa ${mesaId} ha sido liberada automáticamente.`;
    }
  }, delayLiberacion);
}
