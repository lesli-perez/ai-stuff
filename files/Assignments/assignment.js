let assignmentsData = [];

/* -------------------------
   ONE DRIVE CONFIG
--------------------------*/
const ONEDRIVE_BASE =
  "https://utrgv-my.sharepoint.com/personal/emmett_tomai_utrgv_edu/Documents/CS%20Department%20Share/Instructional%20Support/Shared%20Course%20Documents/1101/Resource%20Hub/Assignment-Files/";

function getFileURL(filename) {
  return ONEDRIVE_BASE + encodeURIComponent(filename) + "?download=1";
}

/* Single source of truth */
function openFile(fileURL) {
  window.open(fileURL, "_blank");
}

/* -------------------------
   INIT
--------------------------*/
document.addEventListener("DOMContentLoaded", () => {

  const searchBar = document.getElementById("searchBar");

  fetch("./assignments.json")
    .then(res => res.json())
    .then(data => {

      assignmentsData = data.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base"
        })
      );

      renderCards(assignmentsData);
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

  const container = document.getElementById("assignmentsContainer");
  container.innerHTML = "";

  for (const assignment of data) {

    const fileURL = getFileURL(assignment.file);

    const card = document.createElement("div");
    card.className = "assignment-card clickable";

    card.dataset.title = assignment.title || "";

    card.innerHTML = `
      <div class="card-content">
        <h2>${assignment.title}</h2>

        <a class="btn download-btn"
           href="${fileURL}">
          Download File
        </a>
      </div>
    `;

    container.appendChild(card);

    /* CARD CLICK */
    card.addEventListener("click", () => {
      openFile(fileURL);
    });

    /* BUTTON CLICK (same behavior, but prevents double trigger) */
    card.querySelector(".download-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFile(fileURL);
    });

  }
}