// Codex metadata points to durable completion records, not the capped story log.
export const milestones = [
  { id: "chapter_one_opening", title: "A Place to Begin", description: "Began Chapter 1 in the Stonefield home.", completedStoryEventId: "chapter_one_opening" },
  { id: "rowan_first_craft", title: "A Shape of Your Own", description: "Completed Rowan's first crafting lesson.", completedActionId: "complete_rowan_crafting" },
  { id: "first_exploration_encounter", title: "Off the Beaten Path", description: "Made a choice during an exploration encounter.", completedStoryEventId: "first_exploration_encounter" },
  { id: "first_rare_encounter", title: "An Unusual Find", description: "Made a choice during a rare exploration encounter.", completedStoryEventId: "first_rare_encounter" },
  {
    id: "meet_rowan",
    title: "The Hands Behind the Blade",
    description: "Met the village carpenter who makes Garron's practice swords.",
    completedActionId: "meet_rowan",
  },
  {
    id: "bring_rowan_wood",
    title: "A Helping Hand",
    description: "Brought sound wood to the village carpenter and shared a moment at the workbench.",
    completedActionId: "bring_rowan_wood",
  },
  {
    id: "basic_guard",
    title: "A Steadier Stance",
    description: "Learned Basic Guard through practice with Garron.",
    completedRuleId: "progress_milestone_basic_guard",
  },
  {
    id: "first_gathering_mastery",
    title: "Learning by Doing",
    description: "Earned your first gathering experience and discovered Mastery.",
    completedStoryEventId: "first_gathering_mastery",
  },
];
