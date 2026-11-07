// Working character names live here so later lore edits do not change save IDs.
export const villagePeople = {
  garron: { id: "garron", name: "Garron", role: "Your father", location: "Stonefield House", description: "Your father, Garron Stonefield, is Elira's husband and a retired adventurer who now works the land. Protective and practical, he shows his love through steady guidance and a determination to keep you safe." },
  elira: { id: "elira", name: "Elira", role: "Your mother", location: "Healer's Hut", description: "Your mother. The person who birthed you and gave you love, warmth and compassion. She is also the village healer." },
  rowan: { id: "rowan", name: "Rowan", role: "Village carpenter", location: "Village Square", description: "The carpenter behind Garron's wooden practice swords. Rowan sees useful work in the pieces others leave behind." },
};

export function hasTrainedWithGarron(state) {
  return Boolean(state.unlocks?.completedActions?.train_with_garron
    || state.unlocks?.systems?.combat_basics || state.flags?.combat_basics
    || state.unlocks?.systems?.basic_guard);
}

export function hasMetRowan(state) {
  return Boolean(state.unlocks?.completedActions?.meet_rowan);
}

export const relationshipDefinitions = [
  {
    id: "player_elira", from: "player", to: "elira",
    knownFromStart: true,
    relationship: "Mother and child",
    initialLabel: "Family",
    background: "Elira left her adventuring days behind to build a home with Garron. You grew up surrounded by her love, warmth, and compassion—the same care she brings to her work as the village healer.",
    moments: [],
  },
  {
    id: "garron_elira", from: "garron", to: "elira",
    knownFromStart: true,
    relationship: "Husband and wife",
    initialLabel: "Married",
    background: "Garron and Elira once shared a life of adventure, facing the dangers of the road together. In time, they settled in the village, building a home and raising you. He works the land, she tends to the people, and the life they built together gives them something worth coming home to.",
    moments: [],
  },
  {
    id: "player_garron", from: "player", to: "garron",
    knownFromStart: true,
    relationship: "Father and child",
    initialLabel: "Family",
    background: "Garron traded the dangers of adventuring for a quieter life in the village with Elira and you. His old discipline remains, but so does his wish to give you a safe home. He shows his love through hard work, steady guidance, and looking out for you.",
    moments: [
      { when: hasTrainedWithGarron, label: "First lessons", text: "Your father taught you the basics and entrusted you with a wooden training sword." },
      { when: (state) => Boolean(state.unlocks?.systems?.basic_guard), label: "Growing confidence", text: "Through practice together, you learned Basic Guard. Garron has seen your stance grow steadier." },
      { when: (state) => Boolean(state.unlocks?.completedActions?.collect_training_armor), label: "Looking out for you", text: "Garron set aside a checked and mended armor set to keep you safe during training." },
    ],
  },
  {
    id: "player_rowan", from: "player", to: "rowan",
    moments: [
      { when: hasMetRowan, label: "Introduced", text: "You met Rowan, the village carpenter, and heard about the work behind Garron's practice swords." },
      { when: (state) => Boolean(state.unlocks?.completedActions?.bring_rowan_wood), label: "A helping hand", text: "You brought Rowan sound wood from the trail. A small favor became your first piece of shared work." },
    ],
  },
  {
    id: "garron_rowan", from: "garron", to: "rowan",
    moments: [
      { when: hasMetRowan, label: "Training partners", text: "Rowan makes the wooden swords Garron uses to teach. One shapes the tools; the other teaches people to use them." },
    ],
  },
];
