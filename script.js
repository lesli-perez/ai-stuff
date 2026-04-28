const state = {
  data: [],
  searchQuery: "",
  activeTags: new Set(),
  allTagsByCategory: {},
  flatTagCache: new WeakMap()
};

/* =========================
   CACHE HELPERS
========================= */
function getAllTags(item) {
  if (state.flatTagCache.has(item)) {
    return state.flatTagCache.get(item);
  }
  const tags = Object.values(item.tags).flat();
  state.flatTagCache.set(item, tags);
  return tags;
}

/* =========================
   DOM CACHE
========================= */
const el = {
  container: document.getElementById("container"),
  menu: document.getElementById("filterMenu"),
  search: document.getElementById("search"),
  status: document.getElementById("statusText"),
  arrow: document.getElementById("filterArrow"),
  filterBtn: document.getElementById("filterBtn")
};

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("clearFiltersBtn").addEventListener("click", resetAll);
  el.filterBtn.addEventListener("click", toggleFilterMenu);

  document.addEventListener("click", closeMenuOnOutsideClick);
  document.addEventListener("keydown", handleEsc);

  setupSearchDebounce();

  fetch("files.json")
    .then(res => res.json())
    .then(json => {
      state.data = json;
      buildTagIndex();
      render(state.data);
    });
});

/* =========================
   TAG INDEX (BUILD ONCE)
========================= */
function buildTagIndex() {
  const map = {};

  state.data.forEach(item => {
    for (let cat in item.tags) {
      if (!map[cat]) map[cat] = new Set();
      item.tags[cat].forEach(t => map[cat].add(t));
    }
  });

  state.allTagsByCategory = map;
  renderTagMenu();
}

/* =========================
   MENU RENDER (ONLY ON CHANGE)
========================= */
function renderTagMenu() {
  const categories = Object.keys(state.allTagsByCategory).sort();

  el.menu.innerHTML = categories.map(cat => {
    const tags = [...state.allTagsByCategory[cat]]
      .sort((a,b) => a.localeCompare(b));

    return `
      <div class="filter-group">
        <div class="filter-title">${cat}</div>
        ${tags.map(tag => `
          <label class="filter-item">
            <input type="checkbox"
              data-tag="${tag}"
              ${state.activeTags.has(tag) ? "checked" : ""}>
            ${tag}
          </label>
        `).join("")}
      </div>
    `;
  }).join("");

  el.menu.querySelectorAll("input").forEach(cb => {
    cb.addEventListener("change", () => toggleTag(cb.dataset.tag));
  });
}

/* =========================
   TAG TOGGLE (FAST)
========================= */
function toggleTag(tag) {
  // safety guard
  if (!tag || tag.includes("more")) return;

  if (state.activeTags.has(tag)) {
    state.activeTags.delete(tag);
  } else {
    state.activeTags.add(tag);
  }

  renderTagMenu();
  applyFilters();
}

/* =========================
   SEARCH (DEBOUNCED)
========================= */
function setupSearchDebounce() {
  let t;
  el.search.addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.searchQuery = e.target.value.toLowerCase();
      applyFilters();
    }, 150);
  });
}

/* =========================
   FILTER ENGINE
========================= */
function applyFilters() {
  let results = state.data;

  const query = state.searchQuery;
  const tags = state.activeTags;

  if (query) {
    results = results.filter(item =>
      item.title.toLowerCase().includes(query) ||
      getAllTags(item).join(" ").toLowerCase().includes(query)
    );
  }

  if (tags.size > 0) {
    results = results.filter(item =>
      [...tags].every(tag =>
        getAllTags(item).includes(tag)
      )
    );
  }

  updateStatus();
  render(results);
}

/* =========================
   RESET
========================= */
function resetAll(closeMenu = false) {
  state.searchQuery = "";
  state.activeTags.clear();
  el.search.value = "";

  if (closeMenu) {
    el.menu.classList.remove("show");
    el.arrow.textContent = "▼";
  }

  renderTagMenu();
  applyFilters();
}

/* =========================
   MENU TOGGLE
========================= */
function toggleFilterMenu(e) {
  e.stopPropagation();
  const open = el.menu.classList.toggle("show");
  el.arrow.textContent = open ? "▲" : "▼";
}

/* =========================
   OUTSIDE CLICK CLOSE
========================= */
function closeMenuOnOutsideClick(e) {
  if (!e.target.closest(".filter-wrapper")) {
    el.menu.classList.remove("show");
    el.arrow.textContent = "▼";
  }
}

/* =========================
   ESC KEY
========================= */
function handleEsc(e) {
  if (e.key === "Escape") {
    el.menu.classList.remove("show");
    el.arrow.textContent = "▼";
  }
}

/* =========================
   STATUS
========================= */
function updateStatus() {
  const tags = [...state.activeTags];

  el.status.textContent =
    tags.length === 0 && !state.searchQuery
      ? "Viewing All Files"
      : `Filters: ${tags.join(", ")}${state.searchQuery ? " | Search: " + state.searchQuery : ""}`;
}

/* =========================
   RENDER
========================= */
function render(items) {
  el.container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

    div.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      window.open(item.url, "_blank");
    });

    const tags = getAllTags(item);
    const visible = tags.slice(0, 3);
    const hidden = tags.slice(3);

    const desc = Array.isArray(item.description)
      ? item.description.join("\n\n")
      : item.description || "";

    div.innerHTML = `
      <div class="left">
        <h3>${item.title}</h3>

        ${item.image ? `<img src="${item.image}" class="card-img">` : ""}

        <div class="bottom">
          <div class="tags">
            ${visible.map(t => `<span class="tag">${t}</span>`).join("")}

            ${hidden.length ? `
              <span class="tag more">+${hidden.length} more</span>
              <div class="hidden-tags">
                ${hidden.map(t => `<span class="tag">${t}</span>`).join("")}
              </div>
            ` : ""}
          </div>

          <a class="download" href="${item.file}" target="_blank">
            Open/Download Files
          </a>
        </div>
      </div>

      <div class="right">
        ${marked.parse(desc)}
      </div>
    `;

    div.querySelectorAll(".tag:not(.more)").forEach(t => {
    t.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleTag(t.textContent.trim());
    });
    });

    const more = div.querySelector(".more");

    if (more) {
    more.addEventListener("click", (e) => {
        e.stopPropagation();
        div.querySelector(".hidden-tags").classList.toggle("show");
    });
    }

    el.container.appendChild(div);
  });
}