import { state } from "./state.js";
import { applyFilters } from "./filters.js";
import { safeList } from "./helpers.js";
import { openAdvancedModal } from "./advanced.js";

/* =========================
   TOGGLE TAG (FILTER MENU)
========================= */
export function toggleTag(tag) {
  if (!tag || tag.includes("more")) return;

  if (state.activeTags.has(tag)) {
    state.activeTags.delete(tag);
  } else {
    state.activeTags.add(tag);
  }

  syncCheckboxes();
  applyFilters();
}

/* =========================
   STATUS TEXT
========================= */
export function updateStatus() {
  const el = document.getElementById("statusText");
  const tags = [...state.activeTags];

  el.textContent =
    tags.length === 0 && !state.searchQuery
      ? "Viewing All Files"
      : `Filters: ${safeList(tags)}${
          state.searchQuery ? " | Search: " + state.searchQuery : ""
        }`;
}

/* =========================
   BUILD TAG INDEX
========================= */
export function buildTagIndex() {
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
   RENDER FILTER MENU
========================= */
export function renderTagMenu() {
  const el = document.getElementById("filterMenu");

  const categories = Object.keys(state.allTagsByCategory).sort();

  el.innerHTML = `
    ${categories.map(cat => {
      const tags = [...state.allTagsByCategory[cat]].sort();

      return `
        <div class="filter-group">
          <div class="tag-category-title">${cat}</div>

          ${tags.map(tag => `
            <label class="filter-item">
              <input type="checkbox" data-tag="${tag}">
              ${tag}
            </label>
          `).join("")}
        </div>
      `;
    }).join("")}

    <hr>

    <div id="advancedEntryBtn">⚙ Advanced Filtering</div>
  `;

  el.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", () => toggleTag(cb.dataset.tag));
  });

  syncCheckboxes();

  document.getElementById("advancedEntryBtn")
    ?.addEventListener("click", openAdvancedModal);
}

/* =========================
   SYNC CHECKBOX STATE
========================= */
export function syncCheckboxes() {
  document.querySelectorAll("#filterMenu input[type='checkbox']")
    .forEach(cb => {
      cb.checked = state.activeTags.has(cb.dataset.tag);
    });
}