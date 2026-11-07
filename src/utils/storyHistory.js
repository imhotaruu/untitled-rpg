// Story history is newest-first and capped by the engine. Find how many entries
// were prepended so the reader can follow the same passage even when old ones expire.
// null means this is a different history (for example, loading another save).
export function getPrependedStoryCount(previous, next) {
  if (previous.length === next.length && previous.every((entry, index) => entry === next[index])) return 0;
  if (previous.length === 0) return next.length;
  for (let count = 1; count < next.length; count++) {
    const overlap = next.length - count;
    if (overlap <= previous.length && next.slice(count).every((entry, index) => entry === previous[index])) {
      return count;
    }
  }
  return null;
}
