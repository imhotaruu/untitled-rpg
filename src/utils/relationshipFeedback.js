import { getRelationshipChart } from "../engine/relationshipSystem";

export function createRelationshipFeedback(before, after) {
  const previous = getRelationshipChart(before);
  const next = getRelationshipChart(after);
  const changed = next.connections.filter((connection) =>
    connection.from === "player" && connection.moments.length >
      (previous.connections.find((entry) => entry.id === connection.id)?.moments.length || 0));
  if (!changed.length) return null;
  const discovered = changed.some((connection) => !previous.connections.some((entry) => entry.id === connection.id));
  return {
    tone: "success",
    title: discovered ? "New Connection" : "Bond Updated",
    itemLabel: "Relationships",
    messages: [...changed.map((connection) => `${next.people.find((person) => person.id === connection.to).name} · ${connection.label}`),
      "View your shared moments in Relationships."],
    duration: 7000,
  };
}
