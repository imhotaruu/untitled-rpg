import { storyEvents } from "../data/storyEvents";
import { processStoryEvents } from "./storySystem";
import { recordAreaVisit } from "./progressSystem";
import { processUnlocks } from "./unlockSystem";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function addLog(logList, message) {
  return [message, ...logList].slice(0, 50);
}

export function moveToArea(currentState, area) {
  if (currentState.narrative?.phase === "prologue") return currentState;
  if (currentState.combat || currentState.conversation || currentState.exploration?.pending) return currentState;
  const nextState = clone(currentState);

  if (nextState.player.isResting) {
    nextState.player.isResting = false;
    nextState.actionLog = addLog(nextState.actionLog, "Rest interrupted.");
  }

  nextState.player.area = area.id;
  recordAreaVisit(nextState.progress, area);

  nextState.actionLog = addLog(
    nextState.actionLog,
    `Moved to: ${area.label}`
  );

  processStoryEvents(nextState, storyEvents);
  processUnlocks(nextState);

  return nextState;
}
