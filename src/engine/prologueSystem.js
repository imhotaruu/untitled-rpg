import { prologueScenes, chapterOne, chapterOpening } from "../data/prologue";
import { encounters } from "../data/encounters";
import { normalizeCombat, resolveCombatTurn } from "./combatSystem";

export const chapterNarrative = () => ({ phase: "chapter", chapterId: chapterOne.id, sceneId: null, combat: null });
export const initialNarrative = () => ({ phase: "prologue", chapterId: null, sceneId: prologueScenes[0].id, combat: null, characterDraft: { name: "", gender: "Female" } });
export const isInPrologue = (state) => state.narrative?.phase === "prologue";

export function normalizeNarrative(value) {
  // Saves made before the prologue keep their existing adventure.
  if (value?.phase !== "prologue") return chapterNarrative();
  const oldScenes = { stillness: "v2_scene_1_1", creation: "v2_scene_1_1", war: "v2_scene_2_1", stand: "v2_scene_3_1", seal: "v2_scene_5_1", message: "v2_scene_6_1", bonds: "v2_scene_6_1", years: "chapter" };
  const sceneId = oldScenes[value.sceneId] || value.sceneId;
  const scene = prologueScenes.find((entry) => entry.id === sceneId) || prologueScenes[0];
  const combat = scene.battle && value.combat?.encounterId === "chaos_fragment"
    ? normalizeCombat(value.combat, "divine_veil") : null;
  return { phase: "prologue", chapterId: null, sceneId: scene.id, combat, characterDraft: normalizeCharacterDraft(value.characterDraft) };
}

export function createPrologueCombat() {
  const encounter = encounters.chaos_fragment;
  return {
    version: 1, tutorialVersion: 2, tutorial: { phase: "strike", reading: null, guided: false },
    encounterId: encounter.id, status: "active", round: 1, seed: 34,
    player: { name: "Astraea", hp: 36, maxHp: 36, stamina: 8, maxStamina: 8,
      mp: 30, maxMp: 30, attackPower: 9, defense: 2, guardPower: 7, accuracy: 100, evasion: 5, criticalChance: 0 },
    enemy: { ...encounter.opponent, hp: encounter.opponent.maxHp },
    log: [{ round: 0, messages: ["Starwake shines in your hands. Behind you, Morveth, Aurelion, and Elaris reinforce the seal."] }],
  };
}

export function advancePrologue(state, expectedSceneId) {
  if (!isInPrologue(state) || state.narrative.sceneId !== expectedSceneId) return state;
  const index = prologueScenes.findIndex((scene) => scene.id === expectedSceneId);
  const scene = prologueScenes[index];
  if (!scene) return state;
  if (scene.battle) {
    if (!state.narrative.combat) return { ...state, narrative: { ...state.narrative, combat: createPrologueCombat() } };
    if (state.narrative.combat.status === "active" || state.narrative.combat.tutorial?.reading) return state;
  }
  if (scene.creation) return state;
  if (scene.chapter) return enterChapterOne(state);
  return { ...state, narrative: { ...state.narrative, sceneId: prologueScenes[index + 1].id, combat: null } };
}

export function performPrologueMove(state, moveId) {
  if (!isInPrologue(state) || state.narrative.sceneId !== "battle") return state;
  const { combat } = resolveCombatTurn(state.narrative.combat, moveId);
  return combat === state.narrative.combat ? state : { ...state, narrative: { ...state.narrative, combat } };
}

export function skipPrologue(state) {
  if (!isInPrologue(state)) return state;
  return { ...state, narrative: { ...state.narrative, sceneId: "birth", combat: null } };
}

export const characterGenders = ["Female", "Male", "Non-binary", "Unspecified"];

function normalizeCharacterDraft(value) {
  return { name: typeof value?.name === "string" ? value.name.replace(/\p{Cc}/gu, "").slice(0, 32) : "",
    gender: characterGenders.includes(value?.gender) ? value.gender : "Female" };
}

export function updateBirthIdentity(state, identity) {
  if (!isInPrologue(state) || state.narrative.sceneId !== "birth") return state;
  return { ...state, narrative: { ...state.narrative, characterDraft: normalizeCharacterDraft(identity) } };
}

export function completeBirthScene(state, identity) {
  if (!isInPrologue(state) || state.narrative.sceneId !== "birth") return state;
  const name = typeof identity?.name === "string" ? identity.name.replace(/\p{Cc}/gu, "").trim().replace(/\s+/g, " ") : "";
  if (!name || name.length > 32 || !characterGenders.includes(identity?.gender)) return state;
  return { ...state, player: { ...state.player, name, gender: identity.gender },
    narrative: { ...state.narrative, sceneId: "chapter", combat: null } };
}

function enterChapterOne(state) {
  return {
    ...state, narrative: chapterNarrative(),
    player: { ...state.player, area: "stonefield_house", isResting: false },
    progress: { ...state.progress, areaVisits: { ...state.progress.areaVisits, stonefield_house: 1 } },
    completedStoryEvents: [...new Set([...state.completedStoryEvents, "chapter_one_opening"])],
    storyLog: [chapterOpening, ...state.storyLog].slice(0, 50),
    actionLog: [`${chapterOne.label} — ${chapterOne.title}`, ...state.actionLog].slice(0, 50),
  };
}
