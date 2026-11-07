import { gatheringMasteries } from "../data/gatheringMasteries";

function nonnegativeInteger(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function getGatheringProgress(state, resourceId) {
  const mastery = gatheringMasteries.find((entry) => entry.resourceId === resourceId);
  if (!mastery) return { level: 0, xp: 0, xpRequired: null, started: false, maxed: false };
  let level = Math.min(mastery.maxLevel, nonnegativeInteger(state.gatheringMastery?.levels?.[resourceId]));
  let xp = nonnegativeInteger(state.gatheringMastery?.xp?.[resourceId]);
  while (level < mastery.maxLevel && xp >= mastery.baseXp * mastery.xpGrowth ** level) {
    xp -= mastery.baseXp * mastery.xpGrowth ** level;
    level += 1;
  }
  const maxed = level === mastery.maxLevel;
  if (maxed) xp = 0;
  return { level, xp, maxed, started: level > 0 || xp > 0,
    xpRequired: maxed ? null : mastery.baseXp * mastery.xpGrowth ** level };
}

export function getGatheringLevel(state, resourceId) {
  return getGatheringProgress(state, resourceId).level;
}

export function hasGatheringMastery(state) {
  return gatheringMasteries.some(({ resourceId }) => getGatheringProgress(state, resourceId).started);
}

export function normalizeGatheringMastery(value) {
  const normalized = { levels: {}, xp: {} };
  for (const { resourceId } of gatheringMasteries) {
    const progress = getGatheringProgress({ gatheringMastery: value }, resourceId);
    normalized.levels[resourceId] = progress.level;
    normalized.xp[resourceId] = progress.xp;
  }
  return normalized;
}

export function getGatheringResourceIds(action) {
  return gatheringMasteries.filter(({ resourceId }) =>
    action.gatheringResources?.includes(resourceId) && action.rewards?.[resourceId] > 0
  ).map(({ resourceId }) => resourceId);
}

export function getGatheringBonus(state, resourceId) {
  const mastery = gatheringMasteries.find((entry) => entry.resourceId === resourceId);
  return getGatheringLevel(state, resourceId) * (mastery?.bonusPerLevel || 0);
}

export function getActionResourceRewards(state, action) {
  const rewards = { ...action.rewards };
  for (const id of getGatheringResourceIds(action)) {
    rewards[id] += getGatheringBonus(state, id);
  }
  return rewards;
}

// The preview shows normal yield; supplied rolls keep harvests deterministic.
export function resolveGatheringHarvest(state, action, criticalRolls = {}) {
  const rewards = getActionResourceRewards(state, action);
  const criticalResources = [];
  for (const id of getGatheringResourceIds(action)) {
    const mastery = gatheringMasteries.find((entry) => entry.resourceId === id);
    const roll = criticalRolls?.[id];
    if (!Number.isFinite(roll) || roll < 0 || roll >= mastery.criticalChance) continue;
    rewards[id] *= mastery.criticalMultiplier;
    criticalResources.push(id);
  }
  return { rewards, criticalResources };
}

// Successful effort always grants XP. Harvest randomness never affects it.
export function advanceGatheringMastery(state, action) {
  const messages = [];
  const alreadyUnlocked = hasGatheringMastery(state);
  for (const id of getGatheringResourceIds(action)) {
    if (!state.resources[id]) continue;
    const mastery = gatheringMasteries.find((entry) => entry.resourceId === id);
    const before = getGatheringProgress(state, id);
    if (before.maxed) continue;
    state.gatheringMastery = normalizeGatheringMastery(state.gatheringMastery);
    state.gatheringMastery.xp[id] += mastery.xpPerGather;
    state.gatheringMastery = normalizeGatheringMastery(state.gatheringMastery);
    const after = getGatheringProgress(state, id);
    messages.push({ type: "progress", message: `+${mastery.xpPerGather} ${mastery.label} XP.` });
    if (after.level > before.level) {
      messages.push({ type: "progress", message:
        `${mastery.label} mastery reached Level ${after.level}. Future gathers yield +${getGatheringBonus(state, id)} ${state.resources[id].label}.` });
    }
  }
  if (!alreadyUnlocked && hasGatheringMastery(state)) {
    messages.push({ type: "unlock", message: "Unlocked Character → Mastery." });
  }
  return messages;
}
