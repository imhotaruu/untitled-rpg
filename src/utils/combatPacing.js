// Give damage and outcome messages the longest reading time in each range.
const durations = { use: 3000, hit: 4000, miss: 3500, block: 3500, restore: 3500, turn: 3000, wait: 3500, result: 4000 };

export function getCombatFrameDuration(kind, pace = "normal") {
  if (pace === "fast") return 2000;
  const duration = Object.hasOwn(durations, kind) ? durations[kind] : 3500;
  return pace === "slow" ? duration + 2000 : duration;
}
