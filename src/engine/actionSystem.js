import { storyEvents } from "../data/storyEvents";
import { actions } from "../data/actions";
import { beginExplorationEncounter } from "./explorationSystem";
import { getQuestStatus } from "./questSystem";
import {
  addResources,
  canPayResourceCost,
  payResourceCost,
} from "./resourceSystem";
import {
  canPayStatCost,
  payStatCost,
  restoreStats,
} from "./statSystem";
import { processStoryEvents } from "./storySystem";
import { recordActionProgress } from "./progressSystem";
import { processUnlocks } from "./unlockSystem";
import { grantItemRewards } from "./itemSystem";
import { getActionUnavailableReason } from "./selectors";
import { startCombat } from "./combatSystem";
import { resolveGatheringHarvest, getGatheringResourceIds, advanceGatheringMastery } from "./gatheringSystem";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createLogEntry(type, message) {
  return {
    type,
    message,
  };
}

function addLog(logList, entry) {
  return [entry, ...logList].slice(0, 50);
}

function addLogsInDisplayOrder(logList, entries) {
  return [...entries, ...logList].slice(0, 50);
}

function getActionLog(action, message) {
  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedMessage) {
    return createLogEntry("action", `Action used: ${action.label}`);
  }

  return createLogEntry(
    "action",
    `Action used: ${action.label}\n\n${trimmedMessage}`
  );
}

function isBelowMax(value, max) {
  return value < max - 0.001;
}

function isFullyRested(player) {
  return (
    !isBelowMax(player.hp, player.maxHp) &&
    !isBelowMax(player.stamina, player.maxStamina)
  );
}

function getRestStartMessage(player) {
  const needsHealth = isBelowMax(player.hp, player.maxHp);
  const needsStamina = isBelowMax(player.stamina, player.maxStamina);

  if (needsHealth && needsStamina) {
    return "You settle in and begin recovering health and stamina.";
  }

  if (needsHealth) {
    return "You settle in and begin recovering health.";
  }

  if (needsStamina) {
    return "You settle in and begin recovering stamina.";
  }

  return "You are already fully rested.";
}

function getActionCosts(action) {
  const cost = action.cost || {};

  if (cost.stats || cost.resources) {
    return {
      statCost: cost.stats || {},
      resourceCost: cost.resources || {},
    };
  }

  return {
    statCost: cost,
    resourceCost: {},
  };
}

function formatStatName(stat) {
  const statNames = {
    hp: "health",
    mp: "mana",
    stamina: "stamina",
  };

  return statNames[stat] || stat;
}

function formatUnlockLabel(unlockId) {
  return unlockId
    .split("_")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function formatProgressLabel(progressKey) {
  const progressLabels = {
    combatTraining: "Combat Training",
  };

  return progressLabels[progressKey] || formatUnlockLabel(progressKey);
}

function getActionLabel(actionId) {
  const action = actions.find((entry) => entry.id === actionId);

  return action?.label || formatUnlockLabel(actionId);
}

function getActionUseCount(state, actionId) {
  return state.progress?.actionCounts?.[actionId] || 0;
}

function getMissingStatCosts(player, statCost = {}) {
  return Object.entries(statCost)
    .filter(([stat, amount]) => {
      return typeof player[stat] === "number" && player[stat] < amount;
    })
    .map(([stat]) => formatStatName(stat));
}

function getMissingStatMessage(missingStats) {
  if (missingStats.length === 0) {
    return "Not enough status points.";
  }

  if (missingStats.length === 1) {
    return `Not enough ${missingStats[0]}.`;
  }

  const lastStat = missingStats[missingStats.length - 1];
  const otherStats = missingStats.slice(0, -1).join(", ");

  return `Not enough ${otherStats} and ${lastStat}.`;
}

function ensureProgressGroup(state) {
  if (!state.progress) {
    state.progress = {};
  }

  if (typeof state.progress.totalActions !== "number") {
    state.progress.totalActions = 0;
  }

  if (typeof state.progress.combatTraining !== "number") {
    state.progress.combatTraining = 0;
  }

  if (!state.progress.actionCounts) {
    state.progress.actionCounts = {};
  }

  if (!state.progress.areaVisits) {
    state.progress.areaVisits = {};
  }
}

function ensureUnlockGroups(state) {
  if (!state.unlocks) {
    state.unlocks = {};
  }

  if (!state.unlocks.areas) {
    state.unlocks.areas = {};
  }

  if (!state.unlocks.actions) {
    state.unlocks.actions = {};
  }

  if (!state.unlocks.systems) {
    state.unlocks.systems = {};
  }

  if (!state.unlocks.completedActions) {
    state.unlocks.completedActions = {};
  }

  if (!Array.isArray(state.unlocks.completedRules)) {
    state.unlocks.completedRules = [];
  }
}

function addStoryLog(state, storyEntry) {
  if (!storyEntry) {
    return;
  }

  state.storyLog = addLog(state.storyLog || [], storyEntry);
}

function applyActionStoryEntries(state, action) {
  if (action.story) {
    addStoryLog(state, action.story);
  }

  if (action.storyOnFirstUse && getActionUseCount(state, action.id) === 0) {
    addStoryLog(state, action.storyOnFirstUse);
  }
}

function markOneTimeActionCompleted(state, action) {
  if (!action.oneTime) {
    return;
  }

  ensureUnlockGroups(state);

  const completionId = action.completionId || action.id;

  state.unlocks.completedActions[completionId] = true;
}

function applyUnlocks(state, unlocks = {}) {
  const messages = [];

  ensureUnlockGroups(state);

  if (Array.isArray(unlocks.actions)) {
    unlocks.actions.forEach((actionId) => {
      if (!state.unlocks.actions[actionId]) {
        state.unlocks.actions[actionId] = true;

        messages.push(
          createLogEntry("unlock", `Unlocked action: ${getActionLabel(actionId)}`)
        );
      }
    });
  }

  if (Array.isArray(unlocks.areas)) {
    unlocks.areas.forEach((areaId) => {
      if (!state.unlocks.areas[areaId]) {
        state.unlocks.areas[areaId] = true;

        messages.push(
          createLogEntry("unlock", `Unlocked area: ${formatUnlockLabel(areaId)}`)
        );
      }
    });
  }

  if (Array.isArray(unlocks.systems)) {
    unlocks.systems.forEach((systemId) => {
      if (!state.unlocks.systems[systemId]) {
        state.unlocks.systems[systemId] = true;

        messages.push(
          createLogEntry("unlock", `Unlocked: ${formatUnlockLabel(systemId)}`)
        );
      }
    });
  }

  return messages;
}

function applyActionCompletionUnlocks(state, action) {
  return applyUnlocks(state, action.unlocksOnComplete || {});
}

function applyProgressRewards(state, action) {
  const messages = [];
  const progressRewards = action.progressRewards || {};

  ensureProgressGroup(state);

  Object.entries(progressRewards).forEach(([progressKey, amount]) => {
    if (typeof amount !== "number" || Number.isNaN(amount)) {
      return;
    }

    const currentValue =
      typeof state.progress[progressKey] === "number"
        ? state.progress[progressKey]
        : 0;

    state.progress[progressKey] = Math.max(0, currentValue + amount);

    const sign = amount >= 0 ? "+" : "";

    messages.push(
      createLogEntry(
        "progress",
        `${sign}${amount} ${formatProgressLabel(progressKey)}`
      )
    );
  });

  return messages;
}

function applyProgressMilestones(state, action) {
  const messages = [];
  const milestones = action.progressMilestones || [];

  ensureProgressGroup(state);
  ensureUnlockGroups(state);

  milestones.forEach((milestone) => {
    const progressKey = milestone.progressKey;
    const threshold = milestone.threshold;

    if (!progressKey || typeof threshold !== "number") {
      return;
    }

    const milestoneId =
      milestone.id || `${action.id}_${progressKey}_${threshold}`;
    const completionId = `progress_milestone_${milestoneId}`;
    const currentValue =
      typeof state.progress[progressKey] === "number"
        ? state.progress[progressKey]
        : 0;

    if (state.unlocks.completedRules.includes(completionId)) {
      return;
    }

    if (currentValue < threshold) {
      return;
    }

    state.unlocks.completedRules.push(completionId);

    if (milestone.log) {
      messages.push(createLogEntry("unlock", milestone.log));
    }

    if (milestone.story) {
      addStoryLog(state, milestone.story);
    }

    const unlockMessages = applyUnlocks(state, milestone.unlocks || {});
    messages.push(...unlockMessages);
  });

  return messages;
}

export function performAction(currentState, action, options = {}) {
  if (currentState.narrative?.phase === "prologue") return currentState;
  if (currentState.combat || currentState.conversation || currentState.exploration?.pending) return currentState;
  const nextState = clone(currentState);

  ensureProgressGroup(nextState);
  ensureUnlockGroups(nextState);

  // Enforce availability in the engine as well as the UI, including repeated clicks.
  const unavailableReason = getActionUnavailableReason(action, nextState.player.area, nextState.unlocks);
  if (unavailableReason) {
    nextState.actionLog = addLog(nextState.actionLog, createLogEntry("warning", unavailableReason));
    return nextState;
  }

  if (action.questStage && getQuestStatus(nextState, action.questStage.id) !== action.questStage.status) {
    nextState.actionLog = addLog(nextState.actionLog, createLogEntry("warning", "That quest step is not available yet."));
    return nextState;
  }

  if (action.encounterId) {
    return startCombat(currentState, action.encounterId, options.seed);
  }

  if (action.startsResting) {
    if (nextState.player.isResting) {
      nextState.actionLog = addLog(
        nextState.actionLog,
        getActionLog(action, "You are already resting.")
      );

      return nextState;
    }

    const restMessage = getRestStartMessage(nextState.player);

    if (isFullyRested(nextState.player)) {
      nextState.actionLog = addLog(
        nextState.actionLog,
        getActionLog(action, restMessage)
      );

      return nextState;
    }

    nextState.player.isResting = true;

    nextState.actionLog = addLog(
      nextState.actionLog,
      getActionLog(action, restMessage)
    );

    return nextState;
  }

  if (nextState.player.isResting) {
    nextState.player.isResting = false;
    nextState.actionLog = addLog(
      nextState.actionLog,
      createLogEntry("system", "Rest interrupted.")
    );
  }

  const { statCost, resourceCost } = getActionCosts(action);

  if (!canPayStatCost(nextState.player, statCost)) {
    const missingStats = getMissingStatCosts(nextState.player, statCost);
    const missingStatMessage = getMissingStatMessage(missingStats);

    nextState.actionLog = addLog(
      nextState.actionLog,
      getActionLog(action, missingStatMessage)
    );

    return nextState;
  }

  if (!canPayResourceCost(nextState.resources, resourceCost)) {
    nextState.actionLog = addLog(
      nextState.actionLog,
      getActionLog(action, "Not enough resources.")
    );

    return nextState;
  }

  payStatCost(nextState.player, statCost);
  payResourceCost(nextState.resources, resourceCost);

  restoreStats(nextState.player, action.restore);
  // Current mastery determines this payout; a new level benefits the next gather.
  const { rewards: resourceRewards, criticalResources } = resolveGatheringHarvest(nextState, action, options.criticalRolls);
  addResources(nextState.resources, resourceRewards);
  const gatheringMessages = getGatheringResourceIds(action).map((id) =>
    createLogEntry("resource", `${criticalResources.includes(id) ? "Critical gather! " : ""}Gathered ${resourceRewards[id]} ${nextState.resources[id]?.label || id}${criticalResources.includes(id) ? " (×2 yield)" : ""}.`));
  const masteryMessages = advanceGatheringMastery(nextState, action);

  const itemRewardMessages = grantItemRewards(nextState, action.itemRewards);
  const progressRewardMessages = applyProgressRewards(nextState, action);
  const completionUnlockMessages = applyActionCompletionUnlocks(
    nextState,
    action
  );
  const progressMilestoneMessages = applyProgressMilestones(nextState, action);

  applyActionStoryEntries(nextState, action);

  recordActionProgress(nextState.progress, action);
  markOneTimeActionCompleted(nextState, action);

  const actionLogEntries = [
    getActionLog(action, action.log),
    ...gatheringMessages,
    ...masteryMessages,
    ...itemRewardMessages,
    ...progressRewardMessages,
    ...completionUnlockMessages,
    ...progressMilestoneMessages,
  ];

  nextState.actionLog = addLogsInDisplayOrder(
    nextState.actionLog,
    actionLogEntries
  );

  processStoryEvents(nextState, storyEvents);
  processUnlocks(nextState);

  beginExplorationEncounter(nextState, action, options.encounterRoll);

  return nextState;
}
