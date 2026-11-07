function addLog(logList, message) {
  return [message, ...logList].slice(0, 50);
}

export function processStoryEvents(state, storyEvents = []) {
  storyEvents.forEach((event) => {
    const alreadyCompleted = state.completedStoryEvents.includes(event.id);

    if (alreadyCompleted) return;
    if (!event.condition(state)) return;

    const eventText =
      typeof event.text === "function" ? event.text(state) : event.text;

    if (eventText) {
      state.storyLog = addLog(state.storyLog, eventText);
    }

    state.completedStoryEvents.push(event.id);

    if (event.setFlags) {
      Object.assign(state.flags, event.setFlags);
    }
  });

  return state;
}