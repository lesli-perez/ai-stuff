import { state } from "./state.js";
import { getAllTags } from "./helpers.js";
import { render } from "./render.js";
import { updateStatus } from "./ui.js";
import { applyAdvancedFilters } from "./advanced.js";

export function applyFilters() {
  let results = state.data;

  const query = state.searchQuery;

  const isAdvancedActive = state.mode === "advanced";

  /* SEARCH */
  if (query) {
    const q = query.toLowerCase();

    results = results.filter(item =>
      item.title.toLowerCase().includes(q) ||
      getAllTags(state, item).join(" ").toLowerCase().includes(q)
    );
  }

  /* MODE SWITCH */
  if (isAdvancedActive) {
    results = applyAdvancedFilters(results);
  } else {
    const tags = state.activeTags;

    if (tags.size > 0) {
      results = results.filter(item =>
        [...tags].some(tag =>
          getAllTags(state, item).includes(tag)
        )
      );
    }
  }

 state.filteredCount = results.length;

  render(results);
  updateStatus();
}