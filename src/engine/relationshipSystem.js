import { hasMetRowan, relationshipDefinitions, villagePeople } from "../data/relationships";

// Derive bonds from durable story progress, never from the capped log or click totals.
// This also restores established connections in older saves without replaying scenes.
export function getRelationshipChart(state) {
  const people = [{ id: "player", name: state.player?.name || "Player", role: "You", description: "The people you meet and the moments you share leave their mark here." }];
  people.push(villagePeople.garron, villagePeople.elira);
  if (hasMetRowan(state)) people.push(villagePeople.rowan);
  const known = new Set(people.map((person) => person.id));
  const connections = relationshipDefinitions.flatMap((definition) => {
    if (!known.has(definition.from) || !known.has(definition.to)) return [];
    const moments = definition.moments.filter((moment) => moment.when(state))
      .map(({ label, text }) => ({ label, text }));
    return moments.length || definition.knownFromStart ? [{ id: definition.id, from: definition.from, to: definition.to,
      relationship: definition.relationship, background: definition.background,
      label: moments.at(-1)?.label || definition.initialLabel, moments }] : [];
  });
  return { people, connections };
}
