export const equipmentSlots = [
  { id: "weapon", label: "Weapon", itemSlot: "weapon", group: "weapon" },
  { id: "head", label: "Head Armor", itemSlot: "head", group: "armor", description: "Helmets and headgear." },
  { id: "chest", label: "Chest Armor", itemSlot: "chest", group: "armor", description: "Chestplates and body armor." },
  { id: "arms", label: "Arm Armor", itemSlot: "arms", group: "armor", description: "Bracers and arm guards." },
  { id: "legs", label: "Leg Armor", itemSlot: "legs", group: "armor", description: "Leggings and greaves." },
  { id: "accessory1", label: "Accessory 1", itemSlot: "accessory", group: "accessory" },
  { id: "accessory2", label: "Accessory 2", itemSlot: "accessory", group: "accessory" },
  { id: "accessory3", label: "Accessory 3", itemSlot: "accessory", group: "accessory" },
];

export const armorSlots = equipmentSlots.filter((slot) => slot.group === "armor");

export function formatEquipmentSlotLabel(slotId) {
  return equipmentSlots.find((slot) => slot.id === slotId)?.label || slotId;
}
