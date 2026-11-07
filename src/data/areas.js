export const areas = [
  {
    id: "stonefield_house",
    label: "Stonefield House",
    category: "Village",
    description: "The small home where your new life begins.",
    discovered: true,
  },

  {
    id: "village_square",
    label: "Village Square",
    category: "Village",
    description: "The quiet heart of the village.",
    discovered: false,
    progression: {
      discoverWhen: { type: "conversation", noteId: "garron_footing" },
      discoveryRuleId: "unlock_village_square",
    },
  },

  {
    id: "healers_hut",
    label: "Healer's Hut",
    category: "Village",
    description: "A warm hut filled with herbs, remedies, and gentle care.",
    discovered: false,
    progression: {
      discoverWhen: { type: "conversation", noteId: "garron_footing" },
      discoveryRuleId: "unlock_healers_hut",
    },
  },

  {
    id: "forest_edge",
    label: "Forest Edge",
    category: "Forest",
    description: "A calm but mysterious path leading toward the woods.",
    discovered: false,
    progression: {
      discoverWhen: { type: "conversation", noteId: "rowan_wood" },
      discoveryRuleId: "unlock_forest_edge",
    },
  },

  {
    id: "forest_trail",
    label: "Forest Trail",
    category: "Forest",
    description:
      "A narrow path deeper into the woods. The air feels cooler here, and the village begins to feel distant.",
    discovered: false,
    progression: {
      heardWhen: { type: "conversation", noteId: "rowan_wood" },
      heardHint: "Rowan mentioned a trail beyond the forest edge. You haven't found the way yet.",
      discoverWhen: { type: "action", id: "explore_forest_edge", count: 3 },
      discoveryRuleId: "unlock_forest_trail",
    },
  },
];
