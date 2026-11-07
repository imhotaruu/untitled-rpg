export function markDiscovered(collection, id) {
  if (!collection[id]) return;

  collection[id].discovered = true;
}

export function isDiscovered(collection, id) {
  return Boolean(collection[id]?.discovered);
}