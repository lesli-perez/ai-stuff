export function safeList(input) {
  if (!input) return "";
  if (input instanceof Set) return [...input].join(", ");
  if (Array.isArray(input)) return input.join(", ");
  return String(input);
}

export function getAllTags(state, item) {
  if (state.flatTagCache.has(item)) {
    return state.flatTagCache.get(item);
  }
  const tags = Object.values(item.tags).flat();
  state.flatTagCache.set(item, tags);
  return tags;
}