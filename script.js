const state = {
  data: [],
  searchQuery: "",
  activeTags: new Set(),
  allTagsByCategory: {},
  flatTagCache: new WeakMap()
};

/* =========================
   SAFE HELPERS
========================= */
function safeList(input) {
  if (!input) return "";
  if (input instanceof Set) return [...input].join(", ");
  if (Array.isArray(input)) return input.join(", ");
  return String(input);
}

    
let activeRow = null;
let activeDropdown = null;
document.addEventListener("click", (e) => {
  // =========================
  // TAG DROPDOWN LOGIC
  // =========================
  if (activeDropdown) {
    const clickedInsideDropdown = activeDropdown.contains(e.target);
    const clickedAddButton = e.target.closest(".add-tag-btn");

    if (!clickedInsideDropdown && !clickedAddButton) {
      closeTagDropdown();
    }
  }

  // =========================
  // AND/NOT DROPDOWN LOGIC
  // =========================
  document.querySelectorAll(".adv-op-wrap.open").forEach(wrap => {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove("open");
    }
  });
});


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

const advancedUI = {
  open: false
};

function refreshAdvancedOperators() {
  const rows = [...document.querySelectorAll(".advanced-row")];

  rows.forEach((row, index) => {
    const existing = row.querySelector(".adv-op");

    // FIRST ROW: no operator allowed
    if (index === 0) {
      if (existing) existing.remove();
    }

    const chips = row.querySelector(".adv-selected-tags");
    if (chips) {
      chips.style.minHeight = "28px";
    }
  });

  requestAnimationFrame(() => {
    document.querySelector(".advanced-body")?.offsetHeight;
  });
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
  document.getElementById("clearFiltersBtn").addEventListener("click", (e) => {
    e.stopPropagation(); 
    resetFilter();
  });
  el.filterBtn.addEventListener("click", toggleFilterMenu);

  document.getElementById("closeAdvancedPanel")?.addEventListener("click", () => {
    document.querySelector(".layout")?.classList.remove("filters-open");
  });

  document.addEventListener("click", closeMenuOnOutsideClick);
  document.addEventListener("keydown", handleEsc);
  document.getElementById("addAdvancedRow")?.addEventListener("click", addAdvancedRow);
  document.getElementById("clearAdvanced")?.addEventListener("click", () => {
    const rows = document.getElementById("advancedRows");
    if (!rows) return;

    rows.innerHTML = "";
    addAdvancedRow();
  });

  document.getElementById("applyAdvanced")?.addEventListener("click", () => {
    document.querySelector(".layout")?.classList.remove("filters-open");
  });

  setupSearchDebounce();

  fetch("files.json")
    .then(res => res.json())
    .then(json => {
      state.data = json;
      buildTagIndex();
      render(state.data);
    });

    //SCROLL TO TOP BUTTON
    const scrollBtn = document.getElementById("scrollTopBtn");

    const layout = document.querySelector(".layout");
    const panel = document.getElementById("advancedPanel");
    const addBtn = document.getElementById("addAdvancedRow");
    const clearBtn = document.getElementById("clearAdvanced");
    const applyBtn = document.getElementById("applyAdvanced");


    // show/hide on scroll
    window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        scrollBtn.classList.add("show");
    } else {
        scrollBtn.classList.remove("show");
    }
    });

    // scroll to top
    scrollBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    });
    
});

/* =========================
   TAG INDEX
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
   MENU RENDER
========================= */
function renderTagMenu() {
  const categories = Object.keys(state.allTagsByCategory).sort();

  const tagHTML = categories.map(cat => {
    const tags = [...state.allTagsByCategory[cat]]
      .sort((a, b) => a.localeCompare(b));

    return `
      <div class="filter-group" data-category="${cat}">
        <div class="tag-category-title">${cat}</div>

        <div class="filter-items">
          ${tags.map(tag => `
            <label class="filter-item" data-tag="${tag}">
              <input type="checkbox"
                data-tag="${tag}"
                ${state.activeTags.has(tag) ? "checked" : ""}>
              ${tag}
            </label>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

    el.menu.innerHTML = `
        <input type="text" id="filterSearch" placeholder="Search tags...">

        ${tagHTML}

        <hr>

        <div class="advanced-entry" id="advancedEntryBtn">
            ⚙ Advanced Filtering
        </div>
    `;
  const btn = document.getElementById("advancedEntryBtn");
  if (btn) btn.onclick = openAdvancedModal;

  // checkbox logic
  el.menu.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", () => toggleTag(cb.dataset.tag));
  });

  // search logic
  const search = document.getElementById("filterSearch");

  search.addEventListener("input", () => {
    const val = search.value.toLowerCase();

    const groups = el.menu.querySelectorAll(".filter-group");

    groups.forEach(group => {
      const items = group.querySelectorAll(".filter-item");

      let visibleCount = 0;

      items.forEach(item => {
        const tag = item.dataset.tag.toLowerCase();

        const match = tag.includes(val);

        item.style.display = match ? "flex" : "none";

        if (match) visibleCount++;
      });

      // hide category if no matches
      group.style.display = visibleCount ? "block" : "none";
    });
  });
}

function openAdvancedModal() {
  const layout = document.querySelector(".layout");
  const panel = document.getElementById("advancedPanel");

  layout.classList.toggle("filters-open");

  // ensure at least one row exists when opened
  if (layout.classList.contains("filters-open")) {
    const rows = document.querySelector("#advancedRows");
    if (rows && rows.children.length === 0) {
      addAdvancedRow();
    }
  }
}

function closeTagDropdown() {
  if (!activeDropdown) return;

  activeDropdown.classList.add("hidden");
  activeDropdown.innerHTML = "";

  activeRow = null;
  activeDropdown = null;
}

function openTagDropdown(row, selectedBox, dropdown) {
    if (!dropdown) {
      console.warn("globalTagDropdown not found in DOM");
      return;
    }

  const rect = row.getBoundingClientRect();

  dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;

  const isSameRow =
    activeRow === row &&
    activeDropdown &&
    !activeDropdown.classList.contains("hidden");


  if (isSameRow) {
    closeTagDropdown();
    return;
  }

  activeRow = row;
  activeDropdown = dropdown;

  dropdown.classList.remove("hidden");

  const categories = Object.keys(state.allTagsByCategory).sort();

  dropdown.innerHTML = `
    <input name="tagSearch" type="text" class="tag-search" placeholder="Search tags...">
    ${categories.map(cat => {
      const tags = [...state.allTagsByCategory[cat]].sort();

      return `
        <div class="tag-category">
          <div class="tag-category-title">${cat}</div>
          <div class="tag-list">
            ${tags.map(tag => `
              <div class="tag-option" data-tag="${tag}">
                ${tag}
              </div>
            `).join("")}
          </div>
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

      dropdown.classList.add("hidden");
      dropdown.innerHTML = "";
    });
  });
}

function addAdvancedRow() {
  const container = document.querySelector("#advancedRows");
  if (!container) return;

  const isFirstRow = container.children.length === 0;

  const row = document.createElement("div");
  row.className = "advanced-row";

  row.innerHTML = `
    <div class="adv-op-wrap ${isFirstRow ? "disabled" : ""}">
      ${!isFirstRow ? `
        <button type="button" class="adv-op-btn">
          <span class="adv-op-value">AND</span>
          <span class="adv-op-arrow">▼</span>
        </button>

        <div class="adv-op-menu hidden">
          <div class="adv-op-option" data-value="AND">AND</div>
          <div class="adv-op-option" data-value="NOT">NOT</div>
        </div>
      ` : ``}
    </div>

    <div class="adv-selected-tags"></div>

    <div class="row-actions">
      ${!isFirstRow ? `<button class="delete-row-btn">− Del Row</button>` : ``}
      <button class="add-tag-btn">+ Add Tag</button>
    </div>
  `;

  const dropdown = document.getElementById("globalTagDropdown");
  const addBtn = row.querySelector(".add-tag-btn");
  const deleteBtn = row.querySelector(".delete-row-btn");
  const selectedBox = row.querySelector(".adv-selected-tags");

  const opBtn = row.querySelector(".adv-op-btn");
  const opMenu = row.querySelector(".adv-op-menu");
  const opValue = row.querySelector(".adv-op-value");

  if (opBtn && opMenu) {
    const opWrap = row.querySelector(".adv-op-wrap");

    opBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const isOpen = opWrap.classList.contains("open");

      document.querySelectorAll(".adv-op-wrap.open").forEach(el => {
        el.classList.remove("open");
      });

      if (!isOpen) {
        opWrap.classList.add("open");
      }
    });

    opMenu.querySelectorAll(".adv-op-option").forEach(opt => {
      opt.addEventListener("click", () => {
        opValue.textContent = opt.dataset.value;
        opWrap.classList.remove("open");
      });
    });
  }

  // -------------------------
  // ADD TAG BUTTON
  // -------------------------
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openTagDropdown(row, selectedBox, dropdown);
  });

  // -------------------------
  // DELETE ROW
  // -------------------------
  if (deleteBtn) {
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      row.remove();
    });
  }

  container.appendChild(row);
}

/* =========================
   TAG DROPDOWN
========================= */
function toggleTagDropdown(dropdown) {
  const isOpen = !dropdown.classList.contains("hidden");

  if (isOpen) {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
    return;
  }

  dropdown.classList.remove("hidden");

  const categories = Object.keys(state.allTagsByCategory).sort();

  const buildHTML = categories.map(cat => {
    const tags = [...state.allTagsByCategory[cat]]
      .sort((a, b) => a.localeCompare(b));

    return `
      <div class="tag-category">
        <div class="tag-category-title">${cat}</div>

        <div class="tag-list">
          ${tags.map(tag => `
            <div class="tag-option" data-tag="${tag}">
              <span class="tag-name">${tag}</span>
              <span class="tag-x">✕</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

  dropdown.innerHTML = `
    <input type="text" class="tag-search" placeholder="Search tags...">
    ${buildHTML}
  `;

  const search = dropdown.querySelector(".tag-search");

  // ----------------------------
  // SYNC FUNCTION 
  // ----------------------------
  const syncSelectedState = () => {
    const selectedTags = [...selectedBox.querySelectorAll(".adv-chip")]
      .map(c => c.dataset.tag);

    dropdown.querySelectorAll(".tag-option").forEach(opt => {
      const tag = opt.dataset.tag;
      opt.classList.toggle("selected", selectedTags.includes(tag));
    });
  };

  syncSelectedState();

  // ----------------------------
  // SEARCH
  // ----------------------------
  search.oninput = () => {
    const val = search.value.toLowerCase();

    dropdown.querySelectorAll(".tag-option").forEach(el => {
      const match = el.textContent.toLowerCase().includes(val);
      el.style.display = match ? "flex" : "none";
    });

    syncSelectedState();
  };

  // ----------------------------
  // CLICK HANDLER (TOGGLE)
  // ----------------------------
  dropdown.querySelectorAll(".tag-option").forEach(opt => {
    opt.onclick = () => {
      const tag = opt.dataset.tag;
      const selected = activeRow.querySelector(".adv-selected-tags");

      const existing = [...selected.querySelectorAll(".adv-chip")]
        .find(c => c.dataset.tag === tag);

      // REMOVE
      if (existing) {
        existing.remove();
      }
      // ADD
      else {
        const chip = document.createElement("span");
        chip.className = "adv-chip";
        chip.textContent = tag;
        chip.dataset.tag = tag;

        chip.onclick = () => {
          chip.remove();
          opt.classList.remove("selected");
        };

        selected.appendChild(chip);
      }

      // update UI state
      syncSelectedState();

      // close dropdown
      dropdown.classList.add("hidden");
      dropdown.innerHTML = "";
    };
  });
}

/* =========================
   TAG TOGGLE
========================= */
function toggleTag(tag) {
  if (!tag || tag.includes("more")) return;

  if (state.activeTags.has(tag)) {
    state.activeTags.delete(tag);
  } else {
    state.activeTags.add(tag);
  }

  applyFilters();
}

/* =========================
   SEARCH
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
      [...tags].some(tag =>
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
function resetAll() {
  state.searchQuery = "";
  state.activeTags.clear();
  el.search.value = "";

  renderTagMenu();
  applyFilters();
}

/* =========================
   RESET FILTERS
========================= */
function resetFilter() {
  document.getElementById("search").value = "";
  state.searchQuery = "";
  state.activeTags.clear();

  el.menu.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.checked = false;
  });

  applyFilters();
  updateStatus();
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
   OUTSIDE CLICK
========================= */
function closeMenuOnOutsideClick(e) {
  if (!e.target.closest(".filter-wrapper")) {
    el.menu.classList.remove("show");
    el.arrow.textContent = "▼";
  }
}

/* =========================
   ESC
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
      : `Filters: ${safeList(tags)}${
          state.searchQuery ? " | Search: " + state.searchQuery : ""
        }`;
}

/* =========================
   RENDER
========================= */
function render(items) {
  el.container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

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
            ${visible.map(t => `<span class="tag">${String(t)}</span>`).join("")}

            ${hidden.length ? `
              <span class="tag more">+${hidden.length} more</span>
              <div class="hidden-tags">
                ${hidden.map(t => `<span class="tag">${String(t)}</span>`).join("")}
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

    div.addEventListener("click", (e) => {
        // Prevent card click if clicking:
        // - a tag
        // - a link
        // - the download button
        if (
            e.target.closest(".tag") ||
            e.target.closest("a")
        ) {
            return;
        }

        window.open(item.url, "_blank");
    });

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

            const hiddenTags = div.querySelector(".hidden-tags");
            const isOpen = hiddenTags.classList.toggle("show");

            if (isOpen) {
            more.textContent = "Show less";
            } else {
            more.textContent = `+${hidden.length} more`;
            }
        });
    }

    el.container.appendChild(div);
  });
}