let slidesData = [];

/* -------------------------
   INIT
--------------------------*/
document.addEventListener("DOMContentLoaded", () => {

  const searchBar = document.getElementById("searchBar");

  fetch("./slides.json")
    .then(res => res.json())
    .then(data => {

      //  ALPHABETICAL SORT
      slidesData = data.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base"
        })
      );

      renderCards(slidesData);
      setupPDFObserver();
    });

  // -------------------------
  // SEARCH (STABLE VERSION)
  // -------------------------
  let timeout;

  searchBar.addEventListener("input", (e) => {

    const q = e.target.value.toLowerCase();

    clearTimeout(timeout);

    timeout = setTimeout(() => {

      const cards = document.querySelectorAll(".assignment-card");

      cards.forEach(card => {

        const title = (card.dataset.title || "").toLowerCase();
        const desc = (card.dataset.description || "").toLowerCase();

        const match =
          title.includes(q) ||
          desc.includes(q);

        card.style.display = match ? "flex" : "none";
      });

    }, 80);

  });

});

/* -------------------------
   RENDER CARDS
--------------------------*/
function renderCards(data) {

  const container = document.getElementById("slidesContainer");
  container.innerHTML = "";

  for (const slide of data) {

    const card = document.createElement("div");
    card.className = "assignment-card pdf-layout clickable";

    card.dataset.title = slide.title || "";
    card.dataset.description = (slide.description || []).join(" ");
    card.dataset.pdf = slide.pdf;

    card.innerHTML = `
      <div class="pdf-left">
        <h2>${slide.title}</h2>

        <div class="pdf-container">
          <canvas class="pdfCanvas"></canvas>
        </div>

        <div class="pdf-controls">
          <button class="btn prev">← Prev</button>
          <span class="pageInfo"></span>
          <button class="btn next">Next →</button>
        </div>
      </div>

      <div class="pdf-right">
        <p>${(slide.description || []).join("")}</p>
      </div>
    `;

    container.appendChild(card);

    setupCard(card, slide.pdf);

    card.addEventListener("click", (e) => {
      if (e.target.closest(".pdf-controls")) return;
      window.open(slide.pdf, "_blank");
    });

  }
}

/* -------------------------
   PDF CACHE
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
   SETUP CARD
--------------------------*/
function setupCard(card, url) {

  const canvas = card.querySelector(".pdfCanvas");
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true
  });

  const pageInfo = card.querySelector(".pageInfo");

  const state = {
    pdf: null,
    page: 1,
    rendering: false,
    width: null,
    loaded: false,
    renderTask: null
  };

  cardState.set(card, state);

  // -------------------------
  // LOAD PDF ONLY ONCE
  // -------------------------
  card._loadPDF = async () => {
    if (!state.loaded) {
      state.pdf = await getPDF(url);
      state.loaded = true;
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

      // -------------------------
      // CANCEL OLD RENDER
      // -------------------------
      if (state.renderTask) {
        state.renderTask.cancel();
      }

      state.renderTask = page.render({
        canvasContext: ctx,
        viewport: scaled
      });

      await state.renderTask.promise;

      pageInfo.textContent =
        `${num} / ${state.pdf.numPages}`;

    } catch (err) {

      if (err?.name !== "RenderingCancelledException") {
        console.error("PDF render error:", err);
      }

    } finally {
      state.rendering = false;
    }
  }

  // -------------------------
  // BUTTONS
  // -------------------------
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

  // -------------------------
  // INITIAL LOAD
  // -------------------------
  card._renderFirst = () => renderPage(1);
}

/* -------------------------
   INTERSECTION OBSERVER
--------------------------*/
function setupPDFObserver() {

  const observer = new IntersectionObserver((entries) => {

    for (const entry of entries) {

      if (!entry.isIntersecting) continue;

      const card = entry.target;

      const state = cardState.get(card);
      if (!state) continue;

      // load + render once
      card._loadPDF().then(() => {
        card._renderFirst();
      });

      observer.unobserve(card);
    }

  }, {
    rootMargin: "300px"
  });

  document.querySelectorAll(".assignment-card").forEach(card => {
    observer.observe(card);
  });
}