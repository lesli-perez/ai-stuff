let assignmentsData = [];

/* -------------------------
   INIT
--------------------------*/
document.addEventListener("DOMContentLoaded", () => {

  const searchBar = document.getElementById("searchBar");

  fetch("./assignments.json")
    .then(res => res.json())
    .then(data => {

      // ALPHABETICAL SORT
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

      const cards = document.querySelectorAll(".assignment-card");

      cards.forEach(card => {

        const title = (card.dataset.title || "").toLowerCase();
        const match = title.includes(q);

        card.style.display = match ? "flex" : "none";
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

    const card = document.createElement("div");

    // keep base class
    card.className = "assignment-card clickable";

    card.dataset.title = assignment.title || "";

    card.innerHTML = `
      <div class="card-content">
        <h2>${assignment.title}</h2>

        <a class="btn download-btn"
           href="${assignment.file}"
           download>
           Download File
        </a>
      </div>
    `;

    container.appendChild(card);

    card.addEventListener("click", (e) => {

      if (e.target.closest(".download-btn")) return;

      window.open(assignment.file, "_blank");

    });

  }
}