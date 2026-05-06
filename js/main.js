import { state } from "./state.js";
import { buildTagIndex, toggleTag, updateStatus } from "./ui.js";
import { render } from "./render.js";
import { applyFilters } from "./filters.js";
import "./advanced.js";
import { initAdvancedUI } from "./advanced.js";
import { initAdvancedHelp } from "./advanced.js"; 
import { openAdvancedModal, initPanelToggle} from "./advanced.js";



window.state = state; // TEMP bridge

document.addEventListener("DOMContentLoaded", () => {

    initAdvancedUI();
    initAdvancedHelp();
    initPanelToggle();
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


    document.getElementById("filterBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelector(".layout").classList.add("filters-open");
    });

});