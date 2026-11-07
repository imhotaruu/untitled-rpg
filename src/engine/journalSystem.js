import { journalNotes, journalResources } from "../data/journal";
import { areas } from "../data/areas";
import { actions } from "../data/actions";
import { explorationEncounters } from "../data/explorationEncounters";
import { villagePeople } from "../data/relationships";

const areaFor = (id) => areas.find((area) => area.id === id);
const noteFor = (id) => journalNotes.find((note) => `note:${note.id}` === id);
const resourceFor = (id) => id?.startsWith("resource:") && Object.hasOwn(journalResources, id.slice(9)) ? id.slice(9) : null;
const remembered = (id, read = false) => ({ id, areaId: null, day: null, sourceType: "memory", sourceId: null, read });

function validSource(entry) {
  const resourceId = resourceFor(entry.id);
  if (resourceId && entry.sourceType === "action") {
    return actions.some((action) => action.id === entry.sourceId && action.area === entry.areaId && action.rewards?.[resourceId] > 0);
  }
  if (resourceId && entry.sourceType === "encounter") {
    return explorationEncounters.some((encounter) => encounter.id === entry.sourceId && encounter.areas.includes(entry.areaId)
      && encounter.choices.some((choice) => choice.rewards?.[resourceId] > 0));
  }
  const note = noteFor(entry.id);
  return note && entry.sourceType === "conversation" && entry.sourceId === note.passageId
    && actions.some((action) => action.id === note.actionId && action.area === entry.areaId);
}

export function normalizeJournal(value, state, recoverEarlierNotes = false) {
  if (state.narrative?.phase === "prologue") return { entries: [] };
  const entries = [];
  for (const candidate of Array.isArray(value?.entries) ? value.entries : []) {
    if (!candidate || typeof candidate.id !== "string" || (!resourceFor(candidate.id) && !noteFor(candidate.id))
      || entries.some((entry) => entry.id === candidate.id)) continue;
    if (candidate.sourceType === "memory" || !validSource(candidate)) {
      entries.push(remembered(candidate.id, candidate.read === true));
    } else {
      entries.push({ id: candidate.id, areaId: candidate.areaId, sourceType: candidate.sourceType, sourceId: candidate.sourceId, read: candidate.read === true,
        day: typeof candidate.day === "string" && /^Day \d+ · [\p{L} ]+$/u.test(candidate.day) && candidate.day.length <= 60 ? candidate.day : null });
    }
  }
  // Old saves know which materials were discovered, but not where or when.
  for (const id of Object.keys(journalResources)) {
    const resource = state.resources?.[id];
    const known = resource?.amount > 0 || (id !== "gold" && resource?.discovered)
      || (id === "gold" && ["bring_rowan_wood", "complete_rowan_crafting"].some((actionId) => state.unlocks?.completedActions?.[actionId]));
    if (known && !entries.some((entry) => entry.id === `resource:${id}`)) entries.push(remembered(`resource:${id}`));
  }
  if (recoverEarlierNotes) {
    for (const note of journalNotes) {
      const known = note.ruleId ? state.unlocks?.completedRules?.includes(note.ruleId)
        : state.unlocks?.completedActions?.[note.actionId] || state.progress?.actionCounts?.[note.actionId] > 0;
      if (known && !state.conversation?.passageIds?.includes(note.passageId) && !entries.some((entry) => entry.id === `note:${note.id}`)) {
        entries.push(remembered(`note:${note.id}`));
      }
    }
  }
  return { entries };
}

// Mutates only the new state already owned by the calling engine operation.
function record(state, id, sourceType, sourceId) {
  if (state.narrative?.phase === "prologue") return;
  state.journal ||= { entries: [] };
  if (state.journal.entries.some((entry) => entry.id === id)) return;
  state.journal.entries.unshift({ id, areaId: state.player.area, day: state.player.day, sourceType, sourceId, read: false });
}

export function recordResourceDiscoveries(state, rewards, sourceType, sourceId) {
  for (const [id, amount] of Object.entries(rewards || {})) {
    if (Object.hasOwn(journalResources, id) && Number.isFinite(amount) && amount > 0) record(state, `resource:${id}`, sourceType, sourceId);
  }
}

export function recordConversationNotes(state, passageIds) {
  for (const note of journalNotes) {
    if (passageIds.includes(note.passageId)) record(state, `note:${note.id}`, "conversation", note.passageId);
  }
}

export function getJournalEntries(state) {
  return (state.journal?.entries || []).flatMap((entry) => {
    const resourceId = resourceFor(entry.id);
    const note = noteFor(entry.id);
    const definition = resourceId ? journalResources[resourceId] : note;
    if (!definition) return [];
    const person = note && villagePeople[note.personId];
    const source = entry.sourceType === "action" ? actions.find((action) => action.id === entry.sourceId)?.label
      : entry.sourceType === "encounter" ? explorationEncounters.find((encounter) => encounter.id === entry.sourceId)?.title
        : person?.name;
    return [{ ...entry, read: entry.read === true, title: definition.title, text: definition.text, category: resourceId ? "resources" : "conversations",
      person: person?.name, location: areaFor(entry.areaId)?.label || null, source: source || null }];
  });
}

export function getUnreadJournalCount(state) {
  return getJournalEntries(state).filter((entry) => !entry.read).length;
}

export function markJournalEntryRead(state, id) {
  if (state.narrative?.phase === "prologue" || !getJournalEntries(state).some((entry) => entry.id === id && !entry.read)) return state;
  return { ...state, journal: { ...state.journal,
    entries: state.journal.entries.map((entry) => entry.id === id ? { ...entry, read: true } : entry) } };
}
