import { storyEvents } from "../data/storyEvents";
import { processStoryEvents } from "./storySystem";
import { recordAreaVisit } from "./progressSystem";
import { processUnlocks } from "./unlockSystem";
import { areas } from "../data/areas";
import { getLocationState } from "./locationSystem";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function addLog(logList, message) {
  return [message, ...logList].slice(0, 50);
}

export function moveToArea(currentState, requestedArea) {
  const area = areas.find((entry) => entry.id === requestedArea?.id);
  if (!area || !getLocationState(currentState, area.id).canTravel || area.id === currentState.player.area) return currentState;
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
