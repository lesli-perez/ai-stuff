import { state, activeRow, activeDropdown, setActiveRow, setActiveDropdown } from "./state.js";
import { applyFilters } from "./filters.js";

/* =========================
   GLOBAL CLICK HANDLING
========================= */
document.addEventListener("click", (e) => {
  // close tag dropdown
  if (activeDropdown) {
    const clickedInside = activeDropdown.contains(e.target);
    const clickedBtn = e.target.closest(".add-tag-btn");

    if (!clickedInside && !clickedBtn) {
      closeTagDropdown();
    }
  }

  // close AND/NOT dropdowns
  document.querySelectorAll(".adv-op-wrap.open").forEach(wrap => {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove("open");
    }
  });
});

/* =========================
   ADV PANEL TOGGLE
========================= */
export function openAdvancedModal() {
  const layout = document.querySelector(".layout");
  layout.classList.toggle("filters-open");

  const rows = document.querySelector("#advancedRows");
  if (rows && rows.children.length === 0) {
    addAdvancedRow();
  }
}

/* =========================
   CLOSE TAG DROPDOWN
========================= */
export function closeTagDropdown() {
  if (!activeDropdown) return;

  activeDropdown.classList.add("hidden");
  activeDropdown.innerHTML = "";

  setActiveRow(null);
  setActiveDropdown(null);
}

/* =========================
   OPEN TAG DROPDOWN
========================= */
export function openTagDropdown(row, selectedBox, dropdown) {
  if (!dropdown) return;

  const rect = row.getBoundingClientRect();

  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;

  const isSame =
    activeRow === row &&
    activeDropdown &&
    !activeDropdown.classList.contains("hidden");

  if (isSame) {
    closeTagDropdown();
    return;
  }

  setActiveRow(row);
  setActiveDropdown(dropdown);

  dropdown.classList.remove("hidden");

  const categories = Object.keys(state.allTagsByCategory).sort();

  dropdown.innerHTML = `
    <input type="text" class="tag-search" placeholder="Search tags...">

    ${categories.map(cat => {
      const tags = [...state.allTagsByCategory[cat]].sort();

      return `
        <div class="tag-category">
          <div class="tag-category-title">${cat}</div>

          ${tags.map(tag => `
            <div class="tag-option" data-tag="${tag}">
              <span class="tag-name">${tag}</span>
              <span class="tag-x">✕</span>
            </div>
          `).join("")}
        </div>
      `;
    }).join("")}
  `;

  const search = dropdown.querySelector(".tag-search");

  const sync = () => {
    const selected = [...selectedBox.querySelectorAll(".adv-chip")]
      .map(c => c.dataset.tag);

    dropdown.querySelectorAll(".tag-option").forEach(opt => {
      const isSelected = selected.includes(opt.dataset.tag);
      opt.classList.toggle("selected", isSelected);
    });
  };

  sync();

  search.addEventListener("input", () => {
    const val = search.value.toLowerCase();

    dropdown.querySelectorAll(".tag-option").forEach(opt => {
      opt.style.display = opt.textContent.toLowerCase().includes(val)
        ? "flex"
        : "none";
    });

    sync();
  });

  dropdown.querySelectorAll(".tag-option").forEach(opt => {
    opt.addEventListener("click", () => {
      const tag = opt.dataset.tag;

      const existing = [...selectedBox.querySelectorAll(".adv-chip")]
        .find(c => c.dataset.tag === tag);

      if (existing) {
        existing.remove();
      } else {
        const chip = document.createElement("span");
        chip.className = "adv-chip";
        chip.textContent = tag;
        chip.dataset.tag = tag;

        chip.onclick = () => chip.remove();

        selectedBox.appendChild(chip);
      }

      closeTagDropdown();
    });
  });
}

/* =========================
   ADD ROW
========================= */
export function addAdvancedRow() {
  const container = document.querySelector("#advancedRows");
  if (!container) return;

  const isFirst = container.children.length === 0;

  const row = document.createElement("div");
  row.className = "advanced-row";

  row.innerHTML = `
    <div class="adv-op-wrap ${isFirst ? "disabled" : ""}">
      ${!isFirst ? `
        <button class="adv-op-btn" type="button">
          <span class="adv-op-value">AND</span>
          <span class="adv-op-arrow">▼</span>
        </button>

        <div class="adv-op-menu">
          <div class="adv-op-option" data-value="AND">AND</div>
          <div class="adv-op-option" data-value="NOT">NOT</div>
        </div>
      ` : ""}
    </div>

    <div class="adv-selected-tags"></div>

    <div class="row-actions">
      ${!isFirst ? `<button class="delete-row-btn">− Del Row</button>` : ""}
      <button class="add-tag-btn">+ Add Tag</button>
    </div>
  `;

  const dropdown = document.getElementById("globalTagDropdown");
  const addBtn = row.querySelector(".add-tag-btn");
  const delBtn = row.querySelector(".delete-row-btn");
  const selectedBox = row.querySelector(".adv-selected-tags");

  const opWrap = row.querySelector(".adv-op-wrap");
  const opBtn = row.querySelector(".adv-op-btn");
  const opMenu = row.querySelector(".adv-op-menu");
  const opValue = row.querySelector(".adv-op-value");

  if (opBtn) {
    opBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      document.querySelectorAll(".adv-op-wrap.open")
        .forEach(el => el.classList.remove("open"));

      opWrap.classList.toggle("open");
    });

    opMenu.querySelectorAll(".adv-op-option").forEach(opt => {
      opt.addEventListener("click", () => {
        opValue.textContent = opt.dataset.value;
        opWrap.classList.remove("open");
      });
    });
  }

  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openTagDropdown(row, selectedBox, dropdown);
  });

  if (delBtn) {
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      row.remove();
    });
  }

  container.appendChild(row);
}

/* =========================
   INIT
========================= */
export function initAdvancedUI() {
  document.getElementById("addAdvancedRow")?.addEventListener("click", addAdvancedRow);

  document.getElementById("clearAdvanced")?.addEventListener("click", () => {
    const rows = document.getElementById("advancedRows");
    if (!rows) return;

    rows.innerHTML = "";
    addAdvancedRow();
  });

  document.getElementById("applyAdvanced")?.addEventListener("click", () => {
    document.querySelector(".layout")?.classList.remove("filters-open");
    applyFilters();
  });
}