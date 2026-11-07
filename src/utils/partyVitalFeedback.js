const vitals = [
  { stat: "hp", max: "maxHp", type: "health" },
  { stat: "stamina", max: "maxStamina", type: "stamina" },
  { stat: "mp", max: "maxMp", type: "mana" },
];
const percent = (value, max) => Math.max(0, Math.min(100, value / max * 100));

// Compare snapshots, not attack text or actors: drains and simultaneous losses
// use the same presentation, even when another combatant caused them.
export function getPartyVitalLosses(previous, current) {
  if (!previous || !current) return [];
  return vitals.flatMap(({ stat, max, type }) => {
    if (!Number.isFinite(previous[stat]) || !Number.isFinite(current[stat])
      || !Number.isFinite(previous[max]) || !Number.isFinite(current[max])
      || !(previous[max] > 0) || !(current[max] > 0) || current[stat] >= previous[stat]) return [];
    return [{ type, from: percent(previous[stat], previous[max]), to: percent(current[stat], current[max]) }];
  });
}
