import { state } from "./state.js";
import { applyFilters } from "./filters.js";
import { safeList } from "./helpers.js";
import { openAdvancedModal } from "./advanced.js";
import { CATEGORY_ORDER, TAG_ORDER } from "./state.js";
import { getAdvancedRules } from "./advanced.js";


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
  const query = state.searchQuery;

  const rules = getAdvancedRules();

  let text = "";

  // -------------------------
  // DEFAULT STATE
  // -------------------------
  if (tags.length === 0 && !query && rules.length === 0) {
    el.textContent = "Viewing All Files";
    return;
  }

  // -------------------------
  // BASIC TAG FILTERS
  // -------------------------
  if (tags.length > 0 && rules.length === 0) {
    text = `Filters: ${safeList(tags)}`;
  }

  // -------------------------
  // ADVANCED FILTERS
  // -------------------------
  if (rules.length > 0) {
    const formatted = rules.map(rule => {
      const joined = rule.tags
        .map(t => t)
        .join(" || ");

      if (rule.op === "NOT") {
        return `!(${joined})`;
      }

      return `(${joined})`;
    });

    text = `Filters: ${formatted.join(" && ")}`;
  }

  // -------------------------
  // SEARCH APPEND
  // -------------------------
  if (query) {
    text += ` | Search: ${query}`;
  }

  el.textContent = text;
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
  const el = document.getElementById("sideFilterMenu");


  const categories = Object.keys(state.allTagsByCategory)
    .sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);

      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;

      return ia - ib;
    });

  el.innerHTML = `
    ${categories.map(cat => {

      const tags = [...state.allTagsByCategory[cat]].sort((a, b) => {
      const order = TAG_ORDER[cat] || [];

      const ia = order.indexOf(a);
      const ib = order.indexOf(b);

      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;

      return ia - ib;
    });

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

  `;

  el.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", () => toggleTag(cb.dataset.tag));
  });

  syncCheckboxes();

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