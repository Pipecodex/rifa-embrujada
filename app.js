/* =====================================================
   GRAN RIFA EMBRUJADA 2026
   Versión local: HTML + CSS + JavaScript + LocalStorage
   ===================================================== */

const CONFIG = {
  titulo: "GRAN RIFA EMBRUJADA",
  valor: 100000,
  premio: 5000000,
  totalNumeros: 100,
  fechaSorteo: new Date("2026-10-31T22:00:00")
};

const STORAGE_KEY = "rifa_embrujada_2026_records";
const WINNER_KEY = "rifa_embrujada_2026_winner";

let records = loadRecords();
let winnerData = loadWinner();
let ticketTarget = null;
let currentFilter = "todos";

/* ===================== UTILIDADES ===================== */
function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function loadWinner() {
  try {
    return JSON.parse(localStorage.getItem(WINNER_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveWinner() {
  localStorage.setItem(WINNER_KEY, JSON.stringify(winnerData));
}

function formatMoney(value) {
  return "$" + Number(value).toLocaleString("es-CO");
}

function parseNumberInput(raw) {
  const value = String(raw).trim();
  if (!/^\d{1,2}$/.test(value)) return null;

  const number = parseInt(value, 10);
  if (number < 0 || number > 99) return null;

  return String(number).padStart(2, "0");
}

function isValidPhone(phone) {
  const clean = String(phone).replace(/\D/g, "");
  return /^3\d{9}$/.test(clean);
}

function getShortName(fullName) {
  const words = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "SIN NOMBRE";
  if (words.length === 1) return words[0].toUpperCase();
  return `${words[0]} ${words[words.length - 1]}`.toUpperCase();
}

function safeFileName(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  return new Date(dateValue).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function toast(message, type = "success") {
  const element = document.createElement("div");
  element.className = `toast ${type}`;
  element.textContent = message;
  document.getElementById("toastContainer").appendChild(element);
  setTimeout(() => element.remove(), 3500);
}

function isLocked() {
  return Boolean(winnerData && winnerData.locked);
}

/* ===================== CONTADOR ===================== */
function updateCountdown() {
  const diff = CONFIG.fechaSorteo - new Date();
  const targets = [
    document.querySelector("#cd-dias b"),
    document.querySelector("#cd-horas b"),
    document.querySelector("#cd-min b"),
    document.querySelector("#cd-seg b")
  ];

  if (diff <= 0) {
    targets.forEach((target) => target.textContent = "00");
    return;
  }

  targets[0].textContent = String(Math.floor(diff / 86400000)).padStart(2, "0");
  targets[1].textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
  targets[2].textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  targets[3].textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
}

setInterval(updateCountdown, 1000);
updateCountdown();

/* ===================== ESTADÍSTICAS ===================== */
function getStats() {
  const sold = records.filter((record) => record.status === "vendido" || record.status === "ganador").length;
  const reserved = records.filter((record) => record.status === "apartado").length;
  const occupied = records.length;
  const available = CONFIG.totalNumeros - occupied;
  const revenue = sold * CONFIG.valor;
  const percent = Math.round((sold / CONFIG.totalNumeros) * 100);

  return { sold, reserved, occupied, available, revenue, percent };
}

function renderStats() {
  const stats = getStats();

  document.getElementById("stat-sold").textContent = stats.sold;
  document.getElementById("stat-reserved").textContent = stats.reserved;
  document.getElementById("stat-free").textContent = stats.available;
  document.getElementById("stat-revenue").textContent = formatMoney(stats.revenue);

  document.getElementById("progressText").textContent = `${stats.sold} de ${CONFIG.totalNumeros} números vendidos`;
  document.getElementById("progressPercent").textContent = `${stats.percent}%`;
  document.getElementById("progressFill").style.width = `${stats.percent}%`;
  document.getElementById("progressMoney").textContent = `${formatMoney(stats.revenue)} recaudados de ${formatMoney(CONFIG.totalNumeros * CONFIG.valor)}`;
  document.getElementById("recordsSummary").textContent = `${records.length} registro${records.length === 1 ? "" : "s"} en total`;
}

/* ===================== TABLA Y FILTROS ===================== */
function getStatusLabel(status) {
  if (status === "ganador") return "Ganador";
  if (status === "apartado") return "Apartado";
  return "Vendido";
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
  renderTable();
}

function getFilteredRecords() {
  const query = document.getElementById("searchBox").value.toLowerCase().trim();

  return records.filter((record) => {
    const matchesFilter = currentFilter === "todos" || record.status === currentFilter;
    const matchesQuery =
      record.num.includes(query) ||
      record.name.toLowerCase().includes(query) ||
      record.phone.includes(query);

    return matchesFilter && matchesQuery;
  });
}

function renderTable() {
  const tbody = document.getElementById("tableBody");
  const filtered = getFilteredRecords();
  const locked = isLocked();

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:22px;color:#7d665e">No hay registros para mostrar.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((record) => {
    const index = records.indexOf(record);
    const disabled = locked ? "disabled" : "";

    return `
      <tr>
        <td><span class="badge">${record.num}</span></td>
        <td><strong>${escapeHtml(record.name)}</strong></td>
        <td>${escapeHtml(record.phone)}</td>
        <td><span class="status st-${record.status}">${getStatusLabel(record.status)}</span></td>
        <td>${formatDate(record.createdAt)}</td>
        <td>
          <div class="action">
            <button class="mini mini-edit" onclick="openEdit(${index})" title="Editar" ${disabled}>✏️</button>
            <button class="mini mini-ticket" onclick="openTicket(${index})" title="Abrir boleta">🎫</button>
            <button class="mini mini-del" onclick="deleteRecord(${index})" title="Eliminar" ${disabled}>🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* ===================== ADMINISTRACIÓN ===================== */
function renderAdminState() {
  const locked = isLocked();
  const adminState = document.getElementById("adminState");
  const saveButton = document.getElementById("saveRecordBtn");
  const clearButton = document.getElementById("clearBtn");
  const winnerAdmin = document.getElementById("winnerAdmin");

  if (locked) {
    adminState.textContent = "Edición bloqueada por resultado oficial";
    adminState.classList.add("locked");
    saveButton.disabled = true;
    clearButton.disabled = true;
    winnerAdmin.style.display = "none";
  } else {
    adminState.textContent = "Edición habilitada";
    adminState.classList.remove("locked");
    saveButton.disabled = false;
    clearButton.disabled = false;
    winnerAdmin.style.display = "block";
  }
}

function assignRandomNumber() {
  if (isLocked()) return toast("La edición está bloqueada después del resultado oficial.", "warn");

  const used = new Set(records.map((record) => record.num));
  const available = [];

  for (let i = 0; i < CONFIG.totalNumeros; i++) {
    const number = String(i).padStart(2, "0");
    if (!used.has(number)) available.push(number);
  }

  if (!available.length) return toast("No quedan números disponibles.", "error");

  const selected = available[Math.floor(Math.random() * available.length)];
  document.getElementById("inp-num").value = selected;
  document.getElementById("inp-name").focus();
  toast(`🎲 Número ${selected} asignado. Completa los datos del comprador.`);
}

function addRecord() {
  if (isLocked()) return toast("La edición está bloqueada después del resultado oficial.", "warn");

  const number = parseNumberInput(document.getElementById("inp-num").value);
  const name = document.getElementById("inp-name").value.trim();
  const phone = document.getElementById("inp-phone").value.trim();
  const status = document.getElementById("inp-status").value;

  if (number === null) return toast("Ingresa un número válido entre 00 y 99.", "warn");
  if (!name) return toast("Ingresa nombre y apellido del comprador.", "warn");
  if (!isValidPhone(phone)) return toast("Celular inválido: debe tener exactamente 10 dígitos y comenzar en 3.", "warn");

  const existing = records.find((record) => record.num === number);
  if (existing) return toast(`El número ${number} ya pertenece a ${existing.name}.`, "error");

  records.push({
    num: number,
    name,
    phone,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  saveRecords();
  document.getElementById("inp-num").value = "";
  document.getElementById("inp-name").value = "";
  document.getElementById("inp-phone").value = "";
  document.getElementById("inp-status").value = "vendido";
  renderApp();
  toast(`✅ Número ${number} registrado para ${name}.`);
}

function deleteRecord(index) {
  if (isLocked()) return toast("La edición está bloqueada después del resultado oficial.", "warn");

  const record = records[index];
  if (!record) return;
  if (!confirm(`¿Eliminar el número ${record.num} de ${record.name}?`)) return;

  records.splice(index, 1);
  saveRecords();
  renderApp();
  toast("Registro eliminado.", "warn");
}

function openEdit(index) {
  if (isLocked()) return toast("La edición está bloqueada después del resultado oficial.", "warn");

  const record = records[index];
  if (!record) return;

  document.getElementById("edit-idx").value = index;
  document.getElementById("editNumberLabel").textContent = `Número asignado: ${record.num} · El número no se puede cambiar.`;
  document.getElementById("edit-name").value = record.name;
  document.getElementById("edit-phone").value = record.phone;
  document.getElementById("edit-status").value = record.status === "ganador" ? "vendido" : record.status;
  openModal("modalEdit");
}

function saveEdit() {
  if (isLocked()) return toast("La edición está bloqueada después del resultado oficial.", "warn");

  const index = Number(document.getElementById("edit-idx").value);
  const name = document.getElementById("edit-name").value.trim();
  const phone = document.getElementById("edit-phone").value.trim();
  const status = document.getElementById("edit-status").value;

  if (!records[index]) return;
  if (!name) return toast("Ingresa nombre y apellido.", "warn");
  if (!isValidPhone(phone)) return toast("Celular inválido: debe tener exactamente 10 dígitos y comenzar en 3.", "warn");

  records[index].name = name;
  records[index].phone = phone;
  records[index].status = status;
  records[index].updatedAt = new Date().toISOString();
  saveRecords();
  closeModal("modalEdit");
  renderApp();
  toast("Registro actualizado.");
}

function confirmClear() {
  if (isLocked()) return toast("La edición está bloqueada después del resultado oficial.", "warn");
  if (!records.length) return toast("No hay registros para eliminar.", "warn");
  if (!confirm("¿Eliminar TODOS los registros? Esta acción no se puede deshacer.")) return;

  records = [];
  saveRecords();
  renderApp();
  toast("Todos los registros fueron eliminados.", "warn");
}

/* ===================== RESULTADO OFICIAL ===================== */
function renderWinner() {
  const numberDisplay = document.getElementById("numberDisplay");
  const winnerName = document.getElementById("winnerName");
  const winnerDetail = document.getElementById("winnerDetail");
  const audit = document.getElementById("winnerAuditStatus");

  if (!winnerData) {
    numberDisplay.textContent = "??";
    numberDisplay.classList.remove("confirmed");
    winnerName.textContent = "";
    winnerName.classList.remove("show");
    winnerDetail.textContent = "";
    audit.textContent = "Aún no se ha verificado el resultado.";
    return;
  }

  numberDisplay.textContent = `N° ${winnerData.number}`;
  numberDisplay.classList.add("confirmed");

  if (winnerData.winnerName) {
    winnerName.textContent = `🎉 ${winnerData.winnerName} 🎉`;
    winnerName.classList.add("show");
    winnerDetail.textContent = `Resultado confirmado el ${formatDate(winnerData.confirmedAt)} · Registro bloqueado.`;
  } else {
    winnerName.textContent = "Número sin comprador registrado";
    winnerName.classList.add("show");
    winnerDetail.textContent = `Resultado confirmado el ${formatDate(winnerData.confirmedAt)} · Registro bloqueado.`;
  }

  audit.textContent = `Resultado oficial guardado: ${winnerData.number} · ${formatDate(winnerData.confirmedAt)}`;
}

function launchConfetti() {
  if (typeof confetti !== "function") return;
  const colors = ["#f36316", "#6c24a5", "#56e586", "#ffd568", "#ffffff"];

  confetti({ particleCount: 140, spread: 95, origin: { y: .42 }, colors });
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: .62 }, colors }), 180);
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: .62 }, colors }), 180);
}

function verifyWinner() {
  if (isLocked()) return toast("El resultado ya fue confirmado y está bloqueado.", "warn");

  const number = parseNumberInput(document.getElementById("inp-winner").value);
  if (number === null) return toast("Ingresa un resultado válido entre 00 y 99.", "warn");

  const record = records.find((item) => item.num === number);
  const person = record ? record.name : "Sin comprador registrado";

  if (!confirm(`¿Confirmas como resultado oficial el número ${number}?\n\nGanador: ${person}\n\nDespués de confirmar se bloqueará la edición de registros.`)) return;

  if (record) {
    records = records.map((item) => item.num === number ? { ...item, status: "ganador", updatedAt: new Date().toISOString() } : item);
    saveRecords();
  }

  winnerData = {
    number,
    winnerName: record ? record.name : "",
    confirmedAt: new Date().toISOString(),
    locked: true
  };

  saveWinner();
  renderApp();
  launchConfetti();

  if (record) {
    toast(`🏆 ¡Resultado confirmado! Ganador: ${record.name}, número ${number}.`);
  } else {
    toast(`Resultado ${number} confirmado, pero no había comprador registrado.`, "warn");
  }
}

function resetWinnerView() {
  if (winnerData) return toast("El resultado oficial ya está guardado y no se puede limpiar desde esta versión.", "warn");
  document.getElementById("inp-winner").value = "";
  renderWinner();
}

/* ===================== BOLETA ===================== */
function openTicket(index) {
  const record = records[index];
  if (!record) return;

  ticketTarget = record;
  document.getElementById("numeroRifa").textContent = record.num;
  document.getElementById("nombreRifa").textContent = getShortName(record.name);
  document.getElementById("ticketName").textContent = `Comprador: ${record.name}`;
  document.getElementById("ticketPhone").textContent = `WhatsApp: ${record.phone}`;
  openModal("modalTicket");
}

function sendTicketWA() {
  if (!ticketTarget) return;

  const record = ticketTarget;
  const phone = record.phone.replace(/\D/g, "");
  const message = [
    `*${CONFIG.titulo}*`,
    "",
    `Número: *${record.num}*`,
    `Comprador: ${record.name}`,
    `Valor: ${formatMoney(CONFIG.valor)}`,
    `Premio: ${formatMoney(CONFIG.premio)}`,
    "Sorteo: 31 de octubre de 2026",
    "Modalidad: dos últimas cifras de la Lotería de Boyacá",
    "",
    "¡Deje que la suerte lo asuste!"
  ].join("\n");

  window.open(`https://wa.me/57${phone}?text=${encodeURIComponent(message)}`, "_blank");
}

function captureTicket() {
  const ticket = document.getElementById("ticketPreview");
  return html2canvas(ticket, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#120019",
    imageTimeout: 15000
  });
}

function downloadTicketImage() {
  if (!ticketTarget) return;
  const record = ticketTarget;
  toast("Generando imagen PNG...", "warn");

  captureTicket()
    .then((canvas) => {
      const fileName = `boleta_${record.num}_${safeFileName(getShortName(record.name))}.png`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast("🖼️ Imagen PNG descargada.");
    })
    .catch((error) => {
      console.error("Error PNG:", error);
      toast("No fue posible generar la imagen. Prueba usando Live Server.", "error");
    });
}


/* ===================== EXPORTAR CSV ===================== */
function downloadData() {
  if (!records.length) return toast("No hay registros para exportar.", "warn");

  const header = "Numero,Nombre,Celular,Estado,Fecha de registro,Fecha de actualizacion\n";
  const rows = records.map((record) => [
    record.num,
    `"${record.name.replace(/"/g, '""')}"`,
    record.phone,
    record.status,
    `"${formatDate(record.createdAt)}"`,
    `"${formatDate(record.updatedAt)}"`
  ].join(","));

  const blob = new Blob([header + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gran_rifa_embrujada_2026.csv";
  link.click();
  URL.revokeObjectURL(url);
  toast("CSV descargado.");
}

/* ===================== MODALES ===================== */
function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

document.querySelectorAll(".overlay").forEach((overlay) => {
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.classList.remove("active");
  });
});

/* ===================== RENDER GENERAL ===================== */
function renderApp() {
  renderStats();
  renderTable();
  renderWinner();
  renderAdminState();
}

renderApp();
