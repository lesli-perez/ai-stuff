let cheatSheetsData = [];

/* -------------------------
   ASSET PATH
--------------------------*/
const ASSET_BASE = "./Cheat-Sheets-Files/";

/* -------------------------
   INIT
--------------------------*/
document.addEventListener("DOMContentLoaded", () => {

  const searchBar = document.getElementById("searchBar");

  fetch("./cheat-sheets.json")
    .then(res => res.json())
    .then(data => {

      cheatSheetsData = data.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base"
        })
      );

      renderCards(cheatSheetsData);
      setupPDFObserver();
    });

  let timeout;

  searchBar.addEventListener("input", (e) => {

    const q = e.target.value.toLowerCase();

    clearTimeout(timeout);

    timeout = setTimeout(() => {

      document.querySelectorAll(".assignment-card").forEach(card => {
        const title = (card.dataset.title || "").toLowerCase();
        card.style.display = title.includes(q) ? "flex" : "none";
      });

    }, 80);

  });

});

/* -------------------------
   HELPERS
--------------------------*/
function getFileType(file) {
  const ext = file.split(".").pop().toLowerCase();

  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";

  return "other";
}

function getFileURL(file) {
  return ASSET_BASE + file;
}

/* -------------------------
   RENDER CARDS
--------------------------*/
function renderCards(data) {

  const container = document.getElementById("CheatSheetsContainer");
  container.innerHTML = "";

  for (const sheet of data) {

    const type = getFileType(sheet.file);
    const fileURL = getFileURL(sheet.file);

    const card = document.createElement("div");
    card.className = "assignment-card cheat-layout clickable";

    card.dataset.title = sheet.title || "";
    card.dataset.file = sheet.file;
    card.dataset.type = type;

    if (type === "image") {

      card.innerHTML = `
        <div class="cheat-left">
          <h2>${sheet.title}</h2>
          <img class="cheat-image" src="${fileURL}" alt="${sheet.title}">
        </div>
      `;

    } else if (type === "pdf") {

      card.innerHTML = `
        <div class="cheat-left">
          <h2>${sheet.title}</h2>

          <div class="pdf-container">
            <canvas class="pdfCanvas"></canvas>
          </div>

          <div class="pdf-controls">
            <button class="btn prev">← Prev</button>
            <span class="pageInfo"></span>
            <button class="btn next">Next →</button>
          </div>
        </div>
      `;

      setupCard(card, fileURL);
    }

    container.appendChild(card);

    card.addEventListener("click", () => {
      window.open(fileURL, "_blank");
    });
  }
}

/* -------------------------
   PDF
--------------------------*/
const pdfCache = new Map();

async function getPDF(url) {
  if (pdfCache.has(url)) return pdfCache.get(url);

  const task = pdfjsLib.getDocument({
    url,
    disableFontFace: true
  });

  const pdf = await task.promise;
  pdfCache.set(url, pdf);
  return pdf;
}

/* -------------------------
   CARD STATE
--------------------------*/
const cardState = new WeakMap();

/* -------------------------
   PDF SETUP
--------------------------*/
function setupCard(card, url) {

  const canvas = card.querySelector(".pdfCanvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const pageInfo = card.querySelector(".pageInfo");

  const state = {
    pdf: null,
    page: 1,
    rendering: false,
    renderTask: null
  };

  cardState.set(card, state);

  card._loadPDF = async () => {
    if (!state.pdf) {
      state.pdf = await getPDF(url);
    }
  };

  async function renderPage(num) {

    if (!state.pdf || state.rendering) return;

    state.rendering = true;

    try {

      const page = await state.pdf.getPage(num);

      let width = card.querySelector(".pdf-container").clientWidth;
      if (!width || width < 50) width = 400;

      const viewport = page.getViewport({ scale: 1 });
      const scale = width / viewport.width;
      const scaled = page.getViewport({ scale });

      canvas.width = Math.floor(scaled.width);
      canvas.height = Math.floor(scaled.height);

      if (state.renderTask) state.renderTask.cancel();

      state.renderTask = page.render({
        canvasContext: ctx,
        viewport: scaled
      });

      await state.renderTask.promise;

      pageInfo.textContent = `${num} / ${state.pdf.numPages}`;

    } catch (err) {
      if (err?.name !== "RenderingCancelledException") {
        console.error(err);
      }
    } finally {
      state.rendering = false;
    }
  }

  card.querySelector(".next").onclick = async (e) => {
    e.stopPropagation();
    await card._loadPDF();

    if (state.page < state.pdf.numPages) {
      state.page++;
      renderPage(state.page);
    }
  };

  card.querySelector(".prev").onclick = async (e) => {
    e.stopPropagation();
    await card._loadPDF();

    if (state.page > 1) {
      state.page--;
      renderPage(state.page);
    }
  };

  card._renderFirst = () => renderPage(1);
}

/* -------------------------
   OBSERVER
--------------------------*/
function setupPDFObserver() {

  const observer = new IntersectionObserver((entries) => {

    for (const entry of entries) {

      if (!entry.isIntersecting) continue;

      const card = entry.target;

      const state = cardState.get(card);
      if (!state) continue;

      card._loadPDF().then(() => {
        card._renderFirst();
      });

      observer.unobserve(card);
    }

  }, { rootMargin: "300px" });

  document.querySelectorAll(".assignment-card").forEach(card => {
    observer.observe(card);
  });
}