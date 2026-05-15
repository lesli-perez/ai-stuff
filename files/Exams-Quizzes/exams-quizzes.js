let examsData = [];

/* -------------------------
   ONE DRIVE BASE
--------------------------*/
const ONEDRIVE_BASE =
  "https://utrgv-my.sharepoint.com/personal/emmett_tomai_utrgv_edu/Documents/CS%20Department%20Share/Instructional%20Support/Shared%20Course%20Documents/1101/Resource%20Hub/Exams-Quizzes/";

/* build file URL */
function getFileURL(filename) {
  return ONEDRIVE_BASE + encodeURIComponent(filename) + "?download=1";
}

/* open file */
function openFile(fileURL) {
  window.open(fileURL, "_blank");
}

/* -------------------------
   INIT
--------------------------*/
document.addEventListener("DOMContentLoaded", () => {

  const searchBar = document.getElementById("searchBar");

  fetch("./exams-quizzes.json")
    .then(res => res.json())
    .then(data => {

      examsData = data.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base"
        })
      );

      renderCards(examsData);
    });

  /* -------------------------
     SEARCH
  --------------------------*/
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
   RENDER CARDS
--------------------------*/
function renderCards(data) {

  const container = document.getElementById("ExamsQuizzesContainer");
  container.innerHTML = "";

  for (const item of data) {

    const fileURL = getFileURL(item.file);

    const card = document.createElement("div");
    card.className = "assignment-card clickable";

    card.dataset.title = item.title || "";

    card.innerHTML = `
      <div class="card-content">
        <h2>${item.title}</h2>

        <a class="btn download-btn" href="#">
          Open File
        </a>
      </div>
    `;

    container.appendChild(card);

    card.addEventListener("click", () => {
      openFile(fileURL);
    });

    card.querySelector(".download-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFile(fileURL);
    });

  }
}