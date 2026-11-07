import { useId, useState } from "react";
import { formatEquipmentSlotLabel } from "../data/equipmentSlots";
import { formatStatLabel } from "../utils/formatters";
import EquipmentBonusText from "./ui/EquipmentBonusText";

function getEquippedSlotId(equipment, itemId) {
  return Object.entries(equipment).find(([, equippedId]) => equippedId === itemId)?.[0];
}

function formatItemType(item) {
  if (item.type === "equipment") return item.slot === "accessory" ? "Accessory" : formatEquipmentSlotLabel(item.slot);
  return item.type === "key_item" ? "Key item" : "Consumable";
}

export default function InventoryPanel({ title, items, equipment, onEquipItem, onUseItem }) {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const detailsId = useId();
  const selected = items.find(({ itemId }) => itemId === selectedItemId);
  const item = selected?.item;
  const equippedSlotId = selected ? getEquippedSlotId(equipment, selected.itemId) : null;
  const useEffects = Object.entries(item?.useEffects?.restore || {})
    .map(([stat, amount]) => `+${amount} ${formatStatLabel(stat)}`);

  return (
    <section className="inventory-panel" aria-label={title}>
      <header className="inventory-panel-header">
        <h4>{title}</h4>
        <span>{items.length} {items.length === 1 ? "type" : "types"}</span>
      </header>
      {items.length === 0 ? <p className="inventory-empty">No {title.toLowerCase()} yet.</p>
        : <p className="character-help">Select an item to view its details and actions.</p>}
      <div className="inventory-grid">
        {items.map(({ itemId, item, quantity }) => {
          const equipped = getEquippedSlotId(equipment, itemId);
          return (
            <button key={itemId} type="button" className="inventory-item"
              aria-pressed={selected?.itemId === itemId} aria-controls={detailsId}
              onClick={() => setSelectedItemId(itemId)}>
              <span className="inventory-item-heading">
                <strong>{item?.label || itemId}</strong>
                <span className="inventory-quantity" aria-label={`Quantity: ${quantity}`}>×{quantity}</span>
              </span>
              <span className={equipped ? "inventory-equipped-status" : "inventory-item-kind"}>
                {equipped ? "Equipped" : item ? formatItemType(item) : "Unknown item"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="inventory-selection" id={detailsId}>
        {selected && <>
          <h4>{item?.label || selected.itemId}</h4>
          <p className="inventory-selection-meta">
            {item?.category ? `${item.category} · ` : ""}Quantity: {selected.quantity}
          </p>
          <p>{item?.description || "Details are unavailable for this item."}</p>
          {item && <EquipmentBonusText item={item} />}
          {useEffects.length > 0 && <p>Restores {useEffects.join(", ")}.</p>}
          {equippedSlotId && <p className="inventory-equipped-status">
            Equipped in {formatEquipmentSlotLabel(equippedSlotId)}
          </p>}
          {item?.type === "equipment" && !equippedSlotId && (
            <button type="button" aria-label={`Equip ${item.label}`} onClick={() => onEquipItem(item.id)}>Equip</button>
          )}
          {item?.type === "consumable" && (
            <button type="button" aria-label={`Use ${item.label}`} onClick={() => onUseItem(item.id)}>Use</button>
          )}
          {item?.type === "key_item" && <p className="character-help">Kept for story and progression.</p>}
        </>}
      </div>
    </section>
  );
}
