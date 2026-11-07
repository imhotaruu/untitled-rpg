import { useId, useState } from "react";
import { armorSlots } from "../data/equipmentSlots";
import { items } from "../data/items";
import EquipmentBonusText from "./ui/EquipmentBonusText";

const armorSlotMap = Object.fromEntries(armorSlots.map((slot) => [slot.id, slot]));
const itemMap = new Map(items.map((item) => [item.id, item]));

const bodyRegions = [
  { slot: "head", className: "silhouette-head" },
  { slot: "chest", className: "silhouette-body" },
  { slot: "arms", className: "silhouette-arm silhouette-arm-left", side: "left" },
  { slot: "arms", className: "silhouette-arm silhouette-arm-right", side: "right" },
  { slot: "legs", className: "silhouette-leg silhouette-leg-left", side: "left" },
  { slot: "legs", className: "silhouette-leg silhouette-leg-right", side: "right" },
];

export default function ArmorSlotPreview({ gameState, onEquipItem, onUnequipSlot }) {
  const [selectedSlot, setSelectedSlot] = useState("chest");
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const detailsId = useId();
  const selected = armorSlotMap[selectedSlot];
  const equipment = gameState.equipment || {};
  const equippedItemId = equipment[selectedSlot];
  const equippedItem = itemMap.get(equippedItemId);
  const availableItems = (gameState.inventory?.items || []).flatMap((entry) => {
    const item = itemMap.get(entry.itemId || entry.id);
    return item?.type === "equipment" && item.slot === selected.itemSlot
      && item.id !== equippedItemId && (entry.quantity ?? 1) > 0 ? [item] : [];
  });
  const hasBasicGuard = Boolean(gameState.unlocks?.systems?.basic_guard);
  const collectedArmor = Boolean(gameState.unlocks?.completedActions?.collect_training_armor);

  function getSlotItemLabel(slotId) {
    const itemId = equipment[slotId];
    return itemMap.get(itemId)?.label || itemId || "Empty";
  }

  return (
    <div className="armor-slot-preview">
      <div className="character-portrait">
        <span className="armor-hover-label" aria-hidden="true">
          {hoveredSlot ? `${armorSlotMap[hoveredSlot].label} · ${getSlotItemLabel(hoveredSlot)}` : "Select an armor slot"}
        </span>
        <div className="character-silhouette" role="group" aria-label="Armor equipment slots">
          {bodyRegions.map((region) => (
            <button
              key={region.className}
              type="button"
              className={`body-part ${region.className}`}
              aria-label={`${armorSlotMap[region.slot].label}${region.side ? ` (${region.side})` : ""}: ${getSlotItemLabel(region.slot)}`}
              data-equipped={Boolean(equipment[region.slot])}
              aria-pressed={selectedSlot === region.slot}
              aria-controls={detailsId}
              onPointerEnter={() => setHoveredSlot(region.slot)}
              onPointerLeave={() => setHoveredSlot(null)}
              onFocus={() => setHoveredSlot(region.slot)}
              onBlur={() => setHoveredSlot(null)}
              onClick={() => setSelectedSlot(region.slot)}
            />
          ))}
        </div>
      </div>
      <div className="armor-slot-details" id={detailsId}>
        <div className="armor-slot-details-heading" role="status" aria-atomic="true">
          <strong>{selected.label}</strong>
          <span>{equippedItemId ? "Equipped" : "Empty"}</span>
        </div>
        {equippedItemId ? (
          <div className="armor-equipped-item">
            <strong>{equippedItem?.label || equippedItemId}</strong>
            {equippedItem && (
              <>
                <EquipmentBonusText item={equippedItem} />
              </>
            )}
            <button type="button" onClick={() => onUnequipSlot(selectedSlot)}>
              Unequip {equippedItem?.label || equippedItemId}
            </button>
          </div>
        ) : <p>{selected.description} No armor equipped.</p>}

        {availableItems.length > 0 && (
          <div className="armor-compatible-items">
            <h4>Available for this slot</h4>
            {availableItems.map((item) => (
              <div className="armor-compatible-item" key={item.id}>
                <strong>{item.label}</strong>
                <EquipmentBonusText item={item} />
                <button type="button" onClick={() => onEquipItem(item.id, selectedSlot)}>
                  {equippedItemId ? "Replace with" : "Equip"} {item.label}
                </button>
              </div>
            ))}
          </div>
        )}

        {!equippedItemId && availableItems.length === 0 && (
          <p>
            {collectedArmor
              ? "No compatible armor in your inventory."
              : hasBasicGuard
                ? "Garron has a training set for you. Collect Training Armor at Stonefield House."
                : "Practice with Garron to reach Combat Training 5 and learn Basic Guard. He will then offer you a training armor set."}
          </p>
        )}
      </div>
    </div>
  );
}
