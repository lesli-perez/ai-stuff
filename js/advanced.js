import { state, activeRow, activeDropdown, setActiveRow, setActiveDropdown } from "./state.js";
import { applyFilters } from "./filters.js";
import { CATEGORY_ORDER, TAG_ORDER } from "./state.js";


/* =========================
   GLOBAL CLICK HANDLING
========================= */
document.addEventListener("click", (e) => {
  if (activeDropdown) {
    const inside = activeDropdown.contains(e.target);
    const addBtn = e.target.closest(".add-tag-btn");

    if (!inside && !addBtn) {
      closeTagDropdown();
    }
  }

  document.querySelectorAll(".adv-op-wrap.open").forEach(wrap => {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove("open");
    }
  });
});

/* =========================
   OPEN PANEL
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
   GET RULES FROM UI
========================= */
export function getAdvancedRules() {
  const rows = document.querySelectorAll(".advanced-row");

  const rules = [];

  rows.forEach(row => {
    const op = row.querySelector(".adv-op-value")?.textContent || "AND";

    const tags = [...row.querySelectorAll(".adv-chip")]
      .map(t => t.dataset.tag);

    if (tags.length === 0) return;

    rules.push({ op, tags });
  });

  return rules;
}

/* =========================
   APPLY ADVANCED FILTERS
========================= */
export function applyAdvancedFilters(data) {
  const rules = getAdvancedRules();

  if (rules.length === 0) return data;

  return data.filter(item => {
    const itemTags = new Set(Object.values(item.tags).flat());

    return rules.every(rule => {
      if (!rule.tags || rule.tags.length === 0) return true;

      const matchesAny = rule.tags.some(tag => itemTags.has(tag));

      if (rule.op === "NOT") {
        return !matchesAny;
      }

      // OR logic inside row
      return matchesAny;
    });
  });
}

/* =========================
   TAG DROPDOWN
========================= */
export function closeTagDropdown() {
  if (!activeDropdown) return;

  activeDropdown.classList.add("hidden");
  activeDropdown.innerHTML = "";

  setActiveRow(null);
  setActiveDropdown(null);
}

export function openTagDropdown(row, selectedBox, dropdown) {
  if (!dropdown) return;

  const rect = row.getBoundingClientRect();

  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;

  const same =
    activeRow === row &&
    activeDropdown &&
    !activeDropdown.classList.contains("hidden");

  if (same) {
    closeTagDropdown();
    return;
  }

  setActiveRow(row);
  setActiveDropdown(dropdown);

  dropdown.classList.remove("hidden");

    const categories = Object.keys(state.allTagsByCategory)
    .sort((a, b) => {
        const ia = CATEGORY_ORDER.indexOf(a);
        const ib = CATEGORY_ORDER.indexOf(b);

        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;

        return ia - ib;
    });


  dropdown.innerHTML = `
    <input type="text" class="tag-search" placeholder="Search tags...">

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
        <div class="tag-category">
          <div class="tag-category-title">${cat}</div>

          ${tags.map(tag => `
            <div class="tag-option" data-tag="${tag}">
              <span>${tag}</span>
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
      opt.classList.toggle("selected", selected.includes(opt.dataset.tag));
    });
  };

  sync();

    search.addEventListener("input", () => {
    const val = search.value.toLowerCase();

    const categoryBlocks = dropdown.querySelectorAll(".tag-category");

    categoryBlocks.forEach(block => {
        const options = block.querySelectorAll(".tag-option");

        let hasVisible = false;

        options.forEach(opt => {
        const match = opt.textContent.toLowerCase().includes(val);

        opt.style.display = match ? "flex" : "none";

        if (match) hasVisible = true;
        });

        // 🔥 hide whole category if nothing matches
        block.style.display = hasVisible ? "block" : "none";
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
        applyFilters(); // 🔥 FIX: re-run filters when removed
      } else {
        const chip = document.createElement("span");
        chip.className = "adv-chip";
        chip.textContent = tag;
        chip.dataset.tag = tag;

        chip.onclick = () => {
          chip.remove();
          applyFilters(); // 🔥 FIX: re-run filters when removed
        };

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
      applyFilters(); // optional but recommended
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
    applyFilters();
  });

  document.getElementById("applyAdvanced")?.addEventListener("click", () => {
    applyFilters();
  });
}


export function initAdvancedHelp() {
  const helpBtn = document.getElementById("advancedHelpBtn");
  const tooltip = document.getElementById("advancedHelpTooltip");

  if (!helpBtn || !tooltip) return;

  let open = false;

  const close = () => {
    open = false;
    tooltip.classList.remove("show");
  };

  const toggle = (e) => {
    e.stopPropagation();
    open = !open;
    tooltip.classList.toggle("show", open);
  };

  helpBtn.addEventListener("click", toggle);

  document.addEventListener("click", (e) => {
    const clickedInside =
      tooltip.contains(e.target) || helpBtn.contains(e.target);

    if (!clickedInside) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}