export const explorationEncounterRates = { rare: 0.05, common: 0.20, quietExplorations: 2 };

export const explorationEncounters = [
  {
    id: "sheltered_herbs", rarity: "common", areas: ["forest_edge"], title: "Beneath the roots",
    text: "Beyond the path, a fallen trunk shelters a small patch of healthy herbs. Most are still young, but a few stems are ready to gather.",
    choices: [
      { id: "gather", label: "Gather the mature stems", rewards: { herbs: 2 }, text: "You take only the mature stems, leaving the young plants sheltered beneath the trunk." },
      { id: "leave", label: "Leave them growing", text: "You leave the patch untouched and return to the path." },
    ],
  },
  {
    id: "fallen_bough", rarity: "common", areas: ["forest_trail"], title: "A fallen bough",
    text: "A branch has fallen across the trail. Beneath its weathered bark, several pieces of wood are dry and sound.",
    choices: [
      { id: "collect", label: "Collect the sound wood", rewards: { wood: 3 }, text: "You lift the branch clear of the trail and set aside the pieces worth carrying home." },
      { id: "leave", label: "Step around it", text: "You step around the fallen branch and continue along the trail." },
    ],
  },
  {
    id: "old_trail_cache", rarity: "rare", areas: ["forest_edge", "forest_trail"], title: "An old trail cache",
    text: "A loose stone reveals a weathered box tucked into a hollow. Inside are a few old coins and a folded length of cloth, still dry beneath its waxed covering.",
    choices: [
      { id: "take", label: "Take the useful supplies", rewards: { gold: 8, cloth: 1 }, text: "You recover the coins and the folded cloth, then settle the loose stone back over the empty hollow." },
      { id: "leave", label: "Leave the cache undisturbed", text: "You close the box and replace the stone. Whatever its story, the little cache remains hidden." },
    ],
  },
];

export const explorationActionIds = ["explore_forest_edge", "explore_forest_trail"];
