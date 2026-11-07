import { equipmentSlots } from "./equipmentSlots";

export const items = [
  {
    id: "handmade_training_sword", label: "Handmade Training Sword", type: "equipment",
    slot: "weapon", rarity: "common", category: "Training Gear",
    description: "Your own wooden practice sword, carefully shaped and bound with a cloth grip. Rowan's guidance shows in its balance; your effort shows in every mark.",
    equipmentBonuses: { attackPower: 2, guardPower: 1 },
  },
  {
    id: "training_stick",
    label: "Training Sword",
    type: "equipment",
    slot: "weapon",
    rarity: "common",
    category: "Training Gear",
    description:
      "A wooden practice sword with a rounded edge and a worn grip. Garron has checked it for splinters more than once.",
    equipmentBonuses: {
      attackPower: 1,
      guardPower: 1,
    },
    progression: {
      flags: ["has_training_stick"],
      unlocks: {
        systems: ["combat_basics"],
      },
    },
  },
  {
    id: "threadbare_charm",
    label: "Threadbare Charm",
    type: "equipment",
    slot: "accessory",
    rarity: "common",
    category: "Starter Gear",
    description:
      "A small charm tied with old thread. It does not seem powerful, but it feels important.",
    equipmentBonuses: {
      focus: 1,
      resolve: 1,
    },
    progression: {
      flags: ["has_threadbare_charm"],
    },
  },
  {
    id: "padded_training_cap",
    label: "Padded Training Cap",
    type: "equipment",
    slot: "head",
    rarity: "common",
    category: "Training Armor",
    description: "A quilted cap with a few carefully mended seams. It softens the sting of a clumsy practice blow.",
    equipmentBonuses: { defense: 1 },
  },
  {
    id: "padded_training_vest",
    label: "Padded Training Vest",
    type: "equipment",
    slot: "chest",
    rarity: "common",
    category: "Training Armor",
    description: "Layers of sturdy cloth protect your torso while leaving enough room to practice your stance.",
    equipmentBonuses: { defense: 2 },
  },
  {
    id: "leather_training_bracers",
    label: "Leather Training Bracers",
    type: "equipment",
    slot: "arms",
    rarity: "common",
    category: "Training Armor",
    description: "A matching pair of worn leather guards. Garron has marked where they should sit on your forearms.",
    equipmentBonuses: { guardPower: 1 },
  },
  {
    id: "padded_training_leggings",
    label: "Padded Training Leggings",
    type: "equipment",
    slot: "legs",
    rarity: "common",
    category: "Training Armor",
    description: "Reinforced cloth leggings made for long afternoons of footwork and the occasional stumble.",
    equipmentBonuses: { defense: 1 },
  },
  {
    id: "simple_poultice",
    label: "Simple Poultice",
    type: "consumable",
    rarity: "common",
    category: "Medicine",
    description:
      "A small herbal poultice prepared for minor scrapes and fatigue.",
    useEffects: {
      restore: {
        hp: 3,
        stamina: 2,
      },
    },
  },
  {
    id: "worn_cloak",
    label: "Worn Cloak",
    type: "key_item",
    rarity: "common",
    category: "Keepsake",
    description:
      "A plain cloak from home. It carries the comfort of ordinary days.",
    progression: {
      flags: ["has_home_keepsake"],
    },
  },
  {
    id: "suspicious_pebble",
    label: "Suspicious Pebble",
    type: "key_item",
    rarity: "common",
    category: "???",
    description: "It looks important. It is probably not. Probably.",
    progression: {
      flags: ["has_suspicious_pebble"],
    },
  },
];

export const starterInventory = {
  items: [
    {
      itemId: "threadbare_charm",
      quantity: 1,
    },
    {
      itemId: "simple_poultice",
      quantity: 2,
    },
    {
      itemId: "worn_cloak",
      quantity: 1,
    },
    {
      itemId: "suspicious_pebble",
      quantity: 1,
    },
  ],
};

export const starterEquipment = Object.fromEntries(
  equipmentSlots.map((slot) => [slot.id, slot.id === "accessory1" ? "threadbare_charm" : null])
);
