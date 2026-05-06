import { state, activeRow, activeDropdown, setActiveRow, setActiveDropdown } from "./state.js";
import { applyFilters } from "./filters.js"; 
import { getAllTags } from "./helpers.js";
import { CATEGORY_ORDER, TAG_ORDER } from "./state.js";
import { syncCheckboxes } from "./ui.js";

let syncing = false;

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

  basic.classList.remove("hidden");
  advanced.classList.add("hidden");
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
    const itemTags = new Set(getAllTags(state, item));

    return rules.reduce((acc, rule, index) => {
      const matchesAny = rule.tags.some(tag => itemTags.has(tag));

      let result;

      if (rule.op === "NOT") {
        result = !matchesAny;
      } else {
        result = matchesAny;
      }

      if (index === 0) return result;

      if (rule.op === "AND") return acc && result;
      //if (rule.op === "OR") return acc || result;

      return acc && result;
    }, true);
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
      } else {
        const chip = createChip(tag, selectedBox);
        selectedBox.appendChild(chip);
      }

      syncAdvancedToBasicTopRow();
      syncCheckboxes();   // 🔥 ADD THIS

      applyFilters();
      updateStatus();

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
      syncAdvancedToBasicTopRow();
      applyFilters(); 
      updateStatus();
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
    state.activeTags.clear();
    state.searchQuery = "";

    document.getElementById("search").value = "";

    document.querySelectorAll("#sideFilterMenu input[type='checkbox']")
      .forEach(cb => cb.checked = false);

    resetAdvancedFilters();   
    applyFilters();
   updateStatus();
  });


  document.getElementById("closeAdvancedPanel")?.addEventListener("click", () => {
    document.querySelector(".layout")?.classList.remove("filters-open");
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


export function initPanelToggle() {
  const toggle = document.getElementById("toggleAdvancedMode");
  const basic = document.getElementById("basicFiltersPanel");
  const advanced = document.getElementById("advancedFiltersPanel");
  const title = document.getElementById("panelTitle");
  const help = document.getElementById("advancedHelpWrapper");

  if (!toggle) return;

  toggle.addEventListener("change", () => {
    const isAdvanced = toggle.checked;

    state.mode = isAdvanced ? "advanced" : "basic";

    basic.classList.toggle("hidden", isAdvanced);
    advanced.classList.toggle("hidden", !isAdvanced);
    help.classList.toggle("hidden", !isAdvanced);

    title.textContent = isAdvanced ? "Advanced" : "Filters";

    if (isAdvanced) {
      syncBasicToAdvanced();

      if (advanced.querySelectorAll(".advanced-row").length === 0) {
        addAdvancedRow();
      }
    } else {
      syncAdvancedToBasicTopRow();
      syncCheckboxes();
    }

    applyFilters();
    updateStatus();
  });
}

export function resetAdvancedFilters() {
  const rows = document.getElementById("advancedRows");
  if (!rows) return;

  rows.innerHTML = "";
  addAdvancedRow(); 

  closeTagDropdown();
}


export function syncBasicToAdvanced() {
  const rows = document.getElementById("advancedRows");
  if (!rows) return;

  rows.innerHTML = "";

  const row = document.createElement("div");
  row.className = "advanced-row";

  const box = document.createElement("div");
  box.className = "adv-selected-tags";

  state.activeTags.forEach(tag => {
    const chip = createChip(tag, box);
    box.appendChild(chip);
  });

  const actions = document.createElement("div");
  actions.className = "row-actions";

  const btn = document.createElement("button");
  btn.className = "add-tag-btn";
  btn.textContent = "+ Add Tag";

  const dropdown = document.getElementById("globalTagDropdown");

  btn.onclick = (e) => {
    e.stopPropagation();
    openTagDropdown(row, box, dropdown);
  };

  actions.appendChild(btn);

  row.appendChild(box);
  row.appendChild(actions);

  rows.appendChild(row);
}

export function syncAdvancedToBasicTopRow() {
  const firstRow = document.querySelector(".advanced-row");
  if (!firstRow) return;

  const chips = firstRow.querySelectorAll(".adv-chip");

  state.activeTags.clear();

  chips.forEach(chip => {
    state.activeTags.add(chip.dataset.tag);
  });

  syncCheckboxes();
}


function createChip(tag, container) {
  const chip = document.createElement("span");
  chip.className = "adv-chip";
  chip.textContent = tag;
  chip.dataset.tag = tag;

  chip.onclick = () => {
    chip.remove();
    syncAdvancedToBasicTopRow();
    syncCheckboxes();
    applyFilters(); 
    updateStatus();
  };

  return chip;
}