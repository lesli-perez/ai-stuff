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

export const CATEGORY_ORDER = [
  "Format",
  "Level",
  "Time",
  "Type",
  "Topic",
];

export const TAG_ORDER = {
  Time: ["5 mins.", "15 mins.", "30 mins.", "45 mins.", "1 hour", "2 hours", "multi-day"],
  Level: ["Beginner", "Intermediate", "Advanced", "Expert"]
};