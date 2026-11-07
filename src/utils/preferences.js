export const PREFERENCES_KEY = "new-untitled-game-preferences";
export const DEFAULT_PREFERENCES = Object.freeze({ combatPace: "normal", textSpeed: "normal", motion: "full", confirmStoryActions: true });

export function normalizePreferences(value) {
  return {
    combatPace: ["slow", "normal", "fast"].includes(value?.combatPace)
      ? value.combatPace : DEFAULT_PREFERENCES.combatPace,
    textSpeed: ["slow", "normal", "fast", "instant"].includes(value?.textSpeed)
      ? value.textSpeed : DEFAULT_PREFERENCES.textSpeed,
    motion: ["reduced", "full"].includes(value?.motion)
      ? value.motion : DEFAULT_PREFERENCES.motion,
    confirmStoryActions: typeof value?.confirmStoryActions === "boolean"
      ? value.confirmStoryActions : DEFAULT_PREFERENCES.confirmStoryActions,
  };
}

export function loadPreferences() {
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(PREFERENCES_KEY)));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

// A storage failure must not prevent changing preferences for this session.
export function savePreferences(preferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(normalizePreferences(preferences)));
    return true;
  } catch {
    return false;
  }
}

