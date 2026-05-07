
let slidesData = [];

document.addEventListener("DOMContentLoaded", () => {

  const searchBar = document.getElementById("searchBar");

  fetch("./slides.json")
    .then(res => res.json())
    .then(data => {
      slidesData = data;
      renderCards(slidesData);
    });

  searchBar.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();

    const filtered = slidesData.filter(slide =>
      (slide.title || "").toLowerCase().includes(q) ||
      (slide.description || "").toLowerCase().includes(q)
    );

    renderCards(filtered);
  });

});

function renderCards(data) {
  const container = document.getElementById("slidesContainer");
  container.innerHTML = "";

  data.forEach(slide => {

    const card = document.createElement("div");
    card.className = "assignment-card pdf-layout clickable";

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
        <p>${slide.description}</p>
      </div>
    `;

    container.appendChild(card);

    setupPDF(card, slide.pdf);

    // ✅ CLICK HANDLER (FIXED)
    card.addEventListener("click", (e) => {

      // prevent clicking buttons from opening PDF
      if (e.target.closest(".pdf-controls")) return;

      const pdf = slide.pdf;
      if (pdf) {
        window.open(pdf, "_blank");
      }
    });

  });
}

function setupPDF(card, url) {

  const canvas = card.querySelector(".pdfCanvas");
  const ctx = canvas.getContext("2d");
  const pageInfo = card.querySelector(".pageInfo");

  let pdfDoc = null;
  let pageNum = 1;

  function renderPage(num) {
    pdfDoc.getPage(num).then(page => {

      const width = canvas.parentElement.clientWidth;

      const viewport = page.getViewport({ scale: 1 });
      const scale = width / viewport.width;

      const scaled = page.getViewport({ scale });

      canvas.width = scaled.width;
      canvas.height = scaled.height;

      page.render({
        canvasContext: ctx,
        viewport: scaled
      });

      pageInfo.textContent = `${num} / ${pdfDoc.numPages}`;
    });
  }

  pdfjsLib.getDocument(url).promise.then(pdf => {
    pdfDoc = pdf;
    renderPage(1);
  });

  card.querySelector(".next").onclick = () => {
    if (pageNum < pdfDoc.numPages) {
      pageNum++;
      renderPage(pageNum);
    }
  };

  card.querySelector(".prev").onclick = () => {
    if (pageNum > 1) {
      pageNum--;
      renderPage(pageNum);
    }
  };
}