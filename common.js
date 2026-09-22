/* =====================================================
   GRAN RIFA EMBRUJADA 2026 — Núcleo compartido
   Este archivo lo cargan TODAS las páginas.
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

/* ===================== ALMACENAMIENTO ===================== */
function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (e) { return []; }
}
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
function loadWinner() {
  try { return JSON.parse(localStorage.getItem(WINNER_KEY) || "null"); }
  catch (e) { return null; }
}
function saveWinner(winnerData) {
  localStorage.setItem(WINNER_KEY, JSON.stringify(winnerData));
}
function isLocked() {
  const winnerData = loadWinner();
  return Boolean(winnerData && winnerData.locked);
}

/* ===================== UTILIDADES ===================== */
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
    day: "2-digit", month: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit"
  });
}
function getStatusLabel(status) {
  if (status === "ganador") return "Ganador";
  if (status === "apartado") return "Apartado";
  return "Vendido";
}

/* ===================== NOTIFICACIONES (TOAST) ===================== */
function toast(message, type = "success") {
  let box = document.getElementById("toastContainer");
  if (!box) {
    box = document.createElement("div");
    box.id = "toastContainer";
    box.className = "toast-box";
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ===================== ESTADÍSTICAS ===================== */
function getStats() {
  const records = loadRecords();
  const sold = records.filter(r => r.status === "vendido" || r.status === "ganador").length;
  const reserved = records.filter(r => r.status === "apartado").length;
  const occupied = records.length;
  const available = CONFIG.totalNumeros - occupied;
  const revenue = sold * CONFIG.valor;
  const percent = Math.round((sold / CONFIG.totalNumeros) * 100) || 0;
  return { sold, reserved, occupied, available, revenue, percent };
}

/* ===================== CONTADOR (usado en index.html) ===================== */
function startCountdown() {
  const dias = document.getElementById("cd-dias");
  if (!dias) return;
  const horas = document.getElementById("cd-horas");
  const min = document.getElementById("cd-min");
  const seg = document.getElementById("cd-seg");
  function tick() {
    const diff = CONFIG.fechaSorteo - new Date();
    if (diff <= 0) {
      dias.textContent = "00"; horas.textContent = "00";
      min.textContent = "00"; seg.textContent = "00";
      return;
    }
    dias.textContent = String(Math.floor(diff / 86400000)).padStart(2, "0");
    horas.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
    min.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    seg.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

/* ===================== PROGRESO PÚBLICO (usado en index.html) ===================== */
function renderPublicStats() {
  const stats = getStats();
  const map = {
    "stat-sold": stats.sold,
    "stat-reserved": stats.reserved,
    "stat-free": stats.available,
    "stat-revenue": formatMoney(stats.revenue),
    "progressPercent": `${stats.percent}%`,
    "progressText": `${stats.sold} de ${CONFIG.totalNumeros} números vendidos`,
    "progressMoney": `${formatMoney(stats.revenue)} recaudados de ${formatMoney(CONFIG.totalNumeros * CONFIG.valor)}`
  };
  Object.keys(map).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = map[id];
  });
  const fill = document.getElementById("progressFill");
  if (fill) fill.style.width = `${stats.percent}%`;
}
function renderWinnerBanner() {
  const el = document.getElementById("miniWinner");
  if (!el) return;
  const winnerData = loadWinner();
  if (winnerData && winnerData.locked) {
    el.innerHTML = `🏆 Número ganador: <b>${escapeHtml(winnerData.number)}</b> — ${escapeHtml(winnerData.name || "Sin registrar")}`;
  } else {
    el.textContent = "Aún no se ha verificado el resultado oficial.";
  }
}

/* ===================== MODALES GENÉRICOS ===================== */
function openModal(id) { document.getElementById(id)?.classList.add("active"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("active"); }
