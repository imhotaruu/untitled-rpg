import { villagePeople } from "./relationships";

const carpenterName = villagePeople.rowan.name;

export const actions = [
  {
    id: "begin_rowan_crafting", label: `Learn Crafting with ${carpenterName}`,
    area: "village_square", category: "story", unlocked: false, oneTime: true,
    questStage: { id: "rowan_first_craft", status: "available" },
    description: "Accept Rowan's lesson and receive 1 Cloth for your first sword grip. Bring 4 Wood to the workbench.",
    rewards: { cloth: 1 }, unlocksOnComplete: { systems: ["crafting"] },
    log: "Quest accepted: A Shape of Your Own. Unlocked Crafting. Rowan provided 1 Cloth.",
    story: `${carpenterName} clears a space at the workbench. ‘You've brought me good wood. Now let's see what you can make of it.’ They set down a strip of cloth. ‘Four sound pieces of wood, a little patience, and this for the grip. We'll start with a practice sword. Keep it when we're done.’`,
  },
  {
    id: "complete_rowan_crafting", label: `Show Your Work to ${carpenterName}`,
    area: "village_square", category: "story", unlocked: false, oneTime: true,
    questStage: { id: "rowan_first_craft", status: "ready" },
    description: "Finish Rowan's first crafting lesson. Keep your handmade sword and receive 5 Gold.",
    rewards: { gold: 5 },
    log: "Quest completed: A Shape of Your Own. Received 5 Gold; your handmade sword is yours to keep.",
    story: `${carpenterName} tests the grip, then hands the sword back. ‘Not perfectly straight. Neither was my first.’ They place five coins on the bench. ‘For seeing it through. Take care of that blade—you'll remember more from using it than from watching me.’`,
  },
  {
    id: "meet_rowan",
    label: `Meet ${carpenterName}`,
    category: "story",
    area: "village_square",
    unlocked: false,
    oneTime: true,
    description: "Meet the carpenter who makes Garron's wooden training swords.",
    unlocksOnComplete: { actions: ["bring_rowan_wood"] },
    log: `You met ${carpenterName}. A new connection is recorded in Relationships.`,
    story: `A carpenter at the square notices your practice sword. ‘One of mine,’ they say, brushing shavings from their sleeve. ‘I'm ${carpenterName}. Garron brings them back with more dents than I thought wood could hold.’ Their smile softens as they turn a split offcut in their hands. ‘If you find sound fallen wood along the forest trail, I could use a small bundle. Six pieces would do. No hurry—the woods aren't going anywhere.’`,
  },
  {
    id: "bring_rowan_wood",
    label: `Bring Wood to ${carpenterName}`,
    category: "story",
    area: "village_square",
    unlocked: false,
    oneTime: true,
    description: `Give ${carpenterName} 6 Wood for the workshop. A one-time favor.`,
    cost: { resources: { wood: 6 } },
    rewards: { gold: 5 },
    log: `You gave ${carpenterName} 6 Wood and received 5 Gold. Your connection has grown.`,
    story: `${carpenterName} turns each piece of wood in the light, then makes room for you beside the workbench. ‘Good grain. You took care choosing these.’ For a while, they show you how to follow the grain instead of fighting it. When you leave, five coins rest in your palm, and their farewell carries the warmth of someone expecting to see you again.`,
  },
  {
    id: "talk_village_square",
    label: "Talk",
    area: "village_square",
    log: "You listen to the quiet chatter of the village.",
  },

  {
    id: "rest_home",
    label: "Rest",
    area: "stonefield_house",
    startsResting: true,
  },

  {
    id: "train_with_garron",
    label: "Train with Garron",
    area: "stonefield_house",
    oneTime: true,
    cost: {
      stamina: 1,
    },
    itemRewards: [
      {
        itemId: "training_stick",
        quantity: 1,
      },
    ],
    unlocksOnComplete: {
      actions: ["practice_with_garron"],
    },
    log: "You train with Garron.",
    story:
      "Garron walks you through the basics, then hands you a wooden training sword.",
  },

  {
    id: "practice_with_garron",
    label: "Practice with Garron",
    area: "stonefield_house",
    unlocked: false,
    description:
      "Practice the basic forms Garron taught you with the training sword.",
    storyOnFirstUse:
      "You practice the basic forms Garron taught you, slowly getting used to the weight of the training sword.",
    cost: {
      stamina: 1,
    },
    progressRewards: {
      combatTraining: 1,
    },
    progressMilestones: [
      {
        id: "basic_guard",
        progressKey: "combatTraining",
        threshold: 5,
        unlocks: {
          systems: ["basic_guard"],
        },
        story:
          "Garron notices your stance becoming steadier. You have learned the basics of guarding.",
      },
    ],
  },

  {
    id: "spar_with_garron",
    label: "Spar with Garron",
    area: "stonefield_house",
    unlocked: false,
    encounterId: "garron_spar",
    description: "Test your combat skills against Garron. Uses your equipment and separate, full sparring health and stamina. No lasting injuries, item costs, or rewards. You can end the spar at any time.",
  },

  {
    id: "collect_training_armor",
    label: "Collect Training Armor",
    area: "stonefield_house",
    unlocked: false,
    oneTime: true,
    description: "Garron has set aside a simple armor set for you now that you have learned Basic Guard.",
    itemRewards: [
      { itemId: "padded_training_cap", quantity: 1 },
      { itemId: "padded_training_vest", quantity: 1 },
      { itemId: "leather_training_bracers", quantity: 1 },
      { itemId: "padded_training_leggings", quantity: 1 },
    ],
    log: "Collected Garron's training armor. Equip it from Character → Items.",
    story: "Garron watches you settle into your guard, then nods toward a bundle by the door. ‘You are learning to keep your feet. Now let us keep the bruises down.’ Inside are a patched cap, a padded vest, leather bracers, and reinforced leggings. None of it is new, but every strap has been checked.",
  },

  {
    id: "explore_forest_edge",
    gatheringResources: ["herbs"],
    label: "Explore",
    area: "forest_edge",
    cost: {
      stamina: 1,
    },
    rewards: {
      herbs: 1,
    },
    log: "You explore the nearby forest edge and gather herbs.",
  },

  {
    id: "gather_wood",
    gatheringResources: ["wood"],
    label: "Gather Wood",
    area: "forest_trail",
    description: "Gather sound fallen branches for training equipment and village supplies.",
    cost: { stamina: 2 },
    rewards: { wood: 3 },
    log: "You gather sound wood from fallen branches along the trail.",
    storyOnFirstUse: "Beneath the damp bark, some fallen branches are still sound. You set aside the straight pieces, imagining the shape of a practice blade or the frame of a training target. Even here, the forest has something the village can use.",
  },
  {
    id: "explore_forest_trail",
    label: "Explore",
    area: "forest_trail",
    description: "Follow the trail and look for small discoveries among the trees.",
    cost: { stamina: 1 },
    log: "You explore the winding forest trail.",
  },
  {
    id: "visit_healer",
    label: "Visit Elira",
    area: "healers_hut",
    description: "Visit your mother, the village healer. She can restore up to 2 Health.",
    restore: {
      hp: 2,
    },
    log: "You visit Elira at the healer's hut.",
    storyOnFirstUse: "You spend a quiet moment with your mother, Elira, at the healer's hut. Her work keeps her busy, but there is always a place for you beside her.",
  },

  {
    id: "forage_carefully",
    gatheringResources: ["herbs"],
    label: "Forage Carefully",
    area: "forest_edge",
    unlocked: false,
    cost: {
      stamina: 2,
    },
    rewards: {
      herbs: 3,
    },
    log:
      "You take your time searching the forest edge and gather a better bundle of herbs.",
  },
];
