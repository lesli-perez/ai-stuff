import { state } from "./state.js";
import { getAllTags } from "./helpers.js";
import { render } from "./render.js";
import { updateStatus } from "./ui.js";

export function applyFilters() {
  let results = state.data;

  const query = state.searchQuery;
  const tags = state.activeTags;

  if (query) {
    results = results.filter(item =>
      item.title.toLowerCase().includes(query) ||
      getAllTags(state, item).join(" ").toLowerCase().includes(query)
    );
  }

  if (tags.size > 0) {
    results = results.filter(item =>
      [...tags].some(tag =>
        getAllTags(state, item).includes(tag)
      )
    );
  }

  updateStatus();
  render(results);
}