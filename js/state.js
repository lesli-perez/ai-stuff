export const state = {
  data: [],
  searchQuery: "",
  activeTags: new Set(),
  allTagsByCategory: {},
  flatTagCache: new WeakMap()
};

export let activeRow = null;
export let activeDropdown = null;

export function setActiveRow(val) {
  activeRow = val;
}

export function setActiveDropdown(val) {
  activeDropdown = val;
}