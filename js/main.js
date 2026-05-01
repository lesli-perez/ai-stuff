import { state } from "./state.js";
import { buildTagIndex, toggleTag, updateStatus } from "./ui.js";
import { render } from "./render.js";
import { applyFilters } from "./filters.js";
import "./advanced.js";
import { initAdvancedUI } from "./advanced.js";

document.addEventListener("DOMContentLoaded", () => {
  initAdvancedUI();
});

window.state = state; // TEMP bridge

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // FETCH DATA
  // =========================
  fetch("files.json")
    .then(res => res.json())
    .then(json => {
      state.data = json;

      buildTagIndex();
      render(state.data);
    });

  // =========================
  // SEARCH
  // =========================
  document.getElementById("search").addEventListener("input", (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    applyFilters();
  });

  // =========================
  // BUTTONS (FIXED)
  // =========================

  // SHOW ALL
  document.getElementById("resetBtn").addEventListener("click", () => {
    state.searchQuery = "";
    state.activeTags.clear();

    document.getElementById("search").value = "";

    buildTagIndex();
    applyFilters();
  });

  // CLEAR FILTERS
  document.getElementById("clearFiltersBtn").addEventListener("click", (e) => {
    e.stopPropagation();

    state.searchQuery = "";
    state.activeTags.clear();

    document.getElementById("search").value = "";

    document.querySelectorAll("#filterMenu input[type='checkbox']")
      .forEach(cb => cb.checked = false);

    applyFilters();
    updateStatus();
  });

  // FILTER DROPDOWN TOGGLE
  const filterBtn = document.getElementById("filterBtn");
  const filterMenu = document.getElementById("filterMenu");
  const arrow = document.getElementById("filterArrow");

  filterBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const open = filterMenu.classList.toggle("show");
    arrow.textContent = open ? "▲" : "▼";
  });

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".filter-wrapper")) {
      filterMenu.classList.remove("show");
      arrow.textContent = "▼";
    }
  });

  // ESC CLOSE
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      filterMenu.classList.remove("show");
      arrow.textContent = "▼";
    }
  });
});