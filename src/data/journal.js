// Journal prose records learned information; it does not award achievements.
export const journalResources = {
  herbs: { title: "Herbs", text: "Useful leaves and stems gathered on my travels." },
  wood: { title: "Wood", text: "Sound pieces of wood, worth setting aside for the workbench." },
  cloth: { title: "Cloth", text: "A length of cloth to keep among my supplies." },
  gold: { title: "Gold", text: "Coins received along the way." },
  ore: { title: "Ore", text: "Mineral-bearing stone collected on my travels." },
};

// A note is attached to a specific existing conversation, not a generic NPC visit.
export const journalNotes = [
  { id: "garron_footing", title: "Find my footing", personId: "garron", passageId: "garron_training",
    actionId: "train_with_garron", text: "Father reminded me to settle my stance before worrying about a strong swing. He offered to practice with me at home, and pointed me toward Rowan at the village square and Mother at the healer's hut. Home is a place to rest when I'm tired; Mother can tend to my wounds." },
  { id: "garron_guard", title: "A steadier guard", personId: "garron", passageId: "garron_guard",
    actionId: "practice_with_garron", ruleId: "progress_milestone_basic_guard",
    text: "Keep my feet under me and let my guard do its work. Father wants me to remember how it feels to hold my ground." },
  { id: "elira_care", title: "A place to be cared for", personId: "elira", passageId: "elira_visit",
    actionId: "visit_healer", text: "Mother welcomes me at the healer's hut. I don't need an excuse to visit her. She can tend to my wounds here; when I'm simply tired, resting at home restores my stamina." },
  { id: "rowan_wood", title: "Sound wood along the trail", personId: "rowan", passageId: "rowan_meeting",
    actionId: "meet_rowan", text: "Rowan pointed out the path to the forest edge and mentioned sound fallen wood along the forest trail farther in. They could use a bundle of six pieces, but said there was no hurry." },
  { id: "rowan_grain", title: "Follow the grain", personId: "rowan", passageId: "rowan_wood",
    actionId: "bring_rowan_wood", text: "At the workbench, Rowan showed me how to follow the grain instead of fighting it. Choosing a good piece matters." },
  { id: "rowan_grip", title: "Wood, cloth, and patience", personId: "rowan", passageId: "rowan_lesson",
    actionId: "begin_rowan_crafting", text: "For my first practice sword, Rowan asked for four sound pieces of wood and provided cloth for the grip. The lesson takes place at the workbench in Village Square." },
];
