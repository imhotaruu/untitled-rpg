import { hasGatheringMastery } from "../engine/gatheringSystem";

export const firstGatheringMasteryEvent = {
  id: "first_gathering_mastery",
  condition: hasGatheringMastery,
  text: "You pause over what you have gathered, noticing how much there is still to learn. Which stems are worth keeping, where sound wood lies beneath the bark—these are things your hands could come to know. You have a feeling you will return to this work often, and grow better with practice.",
};

export const storyEvents = [
  {
    id: "first_visit_forest_edge",
    condition: (state) => state.player.area === "forest_edge",
    text:
      "For the first time, you stand at the edge of the forest. The village feels close behind you, but the path ahead feels much larger than it should.",
  },

  {
    id: "first_herb_discovery",
    condition: (state) => state.resources.herbs.discovered,
    text:
      "You discovered your first useful resource: herbs. Even something small may become important in the days ahead.",
  },

  {
    id: "first_exhaustion",
    condition: (state) => state.player.stamina <= 0,
    text:
      "Your body grows heavy from exhaustion. Even determination has its limits.",
  },
  
  {
  id: "explored_forest_three_times",
  condition: (state) =>
    (state.progress.actionCounts.explore_forest_edge || 0) >= 3,
  text:
    "The forest edge begins to feel less unfamiliar. You notice small paths hidden between the trees.",
  },

  {
    id: "visited_home_three_times",
    condition: (state) =>
      (state.progress.areaVisits.stonefield_house || 0) >= 3,
    text:
      "Each return home reminds you that even small moments of rest can become part of your strength.",
  },

  {
    id: "used_ten_actions",
    condition: (state) => state.progress.totalActions >= 10,
    text:
      "Little by little, your days begin to form a rhythm. Small choices are becoming the shape of your journey.",
  },
  // Process this last so discovering mastery is the latest passage that action.
  firstGatheringMasteryEvent,
];
