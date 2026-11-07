import { useId, useState } from "react";
import { items } from "../data/items";
import { equipmentSlots } from "../data/equipmentSlots";
import { formatDerivedCombatStatValue, getDerivedCombatStats, getEquipmentBonusTotals } from "../engine/derivedStats";
import { getUpgradeBonusTotals } from "../engine/upgradeBonuses";
import { hasGatheringMastery } from "../engine/gatheringSystem";
import { formatAttributeLabel, formatDerivedCombatStatLabel, formatRegenValue, formatStatValue } from "../utils/formatters";
import InfoRow from "./ui/InfoRow";
import EquipmentBonusText from "./ui/EquipmentBonusText";
import GatheringMasteries from "./GatheringMasteries";
import ArmorSlotPreview from "./ArmorSlotPreview";
import InventoryPanel from "./InventoryPanel";
import UpgradeCard from "./UpgradeCard";

const itemMap = new Map(items.map((item) => [item.id, item]));
const otherEquipmentSlots = equipmentSlots.filter((slot) => slot.group !== "armor");
const attributeOrder = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma", "luck"];
const combatStatGroups = [
  { label: "Offense", stats: ["attackPower", "accuracy", "criticalChance"] },
  { label: "Defense", stats: ["defense", "guardPower", "evasion"] },
  { label: "Support", stats: ["initiative", "focus", "resolve"] },
];
const characterTabs = [
  { id: "overview", label: "Overview" }, { id: "combat", label: "Combat" },
  { id: "upgrades", label: "Upgrades" }, { id: "mastery", label: "Mastery" },
  { id: "items", label: "Items" },
];
const upgradeGroups = [
  { id: "conditioning", label: "Conditioning", description: "Build your reserves and recover between outings." },
  { id: "techniques", label: "Combat techniques", description: "Develop stronger strikes, steadier aim, or a firmer guard." },
];

function TabBar({ tabs, active, onChange, id, label, className }) {
  function handleKeyDown(event, index) {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    onChange(tabs[nextIndex].id);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex].focus();
  }

  return <div className={className} role="tablist" aria-label={label}>
    {tabs.map((tab, index) => <button key={tab.id} type="button" role="tab"
      id={`${id}-tab-${tab.id}`} aria-controls={`${id}-panel`} aria-selected={active === tab.id}
      tabIndex={active === tab.id ? 0 : -1} className={active === tab.id ? "primary" : ""}
      onClick={() => onChange(tab.id)} onKeyDown={(event) => handleKeyDown(event, index)}>
      {tab.label}
    </button>)}
  </div>;
}

export default function CharacterPage({
  player, resources, gameState, currentAreaLabel,
  upgrades, activeTab, onChangeTab, onPurchaseUpgrade, onEquipItem, onUnequipSlot, onUseItem,
}) {
  const [inventoryTab, setInventoryTab] = useState("equipment");
  const characterTabsId = useId();
  const inventoryTabsId = useId();
  const visibleTabs = characterTabs.filter((tab) => tab.id !== "mastery" || hasGatheringMastery(gameState));
  const selectedTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : "overview";
  const equipment = gameState.equipment || {};
  const combatTraining = gameState.progress?.combatTraining ?? 0;
  const combatBasicsUnlocked = Boolean(gameState.unlocks?.systems?.combat_basics);
  const basicGuardUnlocked = Boolean(gameState.unlocks?.systems?.basic_guard);
  const derivedCombatStats = getDerivedCombatStats(player, gameState);
  const equipmentBonusTotals = getEquipmentBonusTotals(gameState);
  const upgradeBonusTotals = getUpgradeBonusTotals(gameState);
  const discoveredResources = Object.entries(resources).filter(([id, resource]) => id !== "gold" && resource.discovered);
  const resolvedItems = (gameState.inventory?.items || [])
    .filter((entry) => (entry.quantity ?? 1) > 0)
    .map((entry) => {
      const itemId = entry.itemId || entry.id;
      return { itemId, item: itemMap.get(itemId), quantity: entry.quantity ?? 1 };
    });
  const unknownItems = resolvedItems.filter(({ item }) => !item);
  const inventoryGroups = [
    { id: "equipment", label: "Equipment", items: resolvedItems.filter(({ item }) => item?.type === "equipment") },
    { id: "consumables", label: "Consumables", items: resolvedItems.filter(({ item }) => item?.type === "consumable") },
    { id: "key-items", label: "Key Items", items: resolvedItems.filter(({ item }) => item?.type === "key_item") },
    ...(unknownItems.length ? [{ id: "unknown", label: "Unknown", items: unknownItems }] : []),
  ];
  const selectedGroup = inventoryGroups.find((group) => group.id === inventoryTab) || inventoryGroups[0];

  return (
    <section className="character-page-panel">
      <div className="panel-header"><h2>Character</h2></div>
      <TabBar tabs={visibleTabs} active={selectedTab} onChange={onChangeTab}
        id={characterTabsId} label="Character sections" className="character-page-tabs" />
      <div className="character-page-content" role="tabpanel" id={`${characterTabsId}-panel`}
        aria-labelledby={`${characterTabsId}-tab-${selectedTab}`} tabIndex={0}>
        {selectedTab === "overview" && <>
          <section className="character-card character-card-wide">
            <header className="character-summary-header">
              <h3>{player.name}</h3><span>Level {player.level}</span>
            </header>
            <div className="character-grid">
              <InfoRow label="Health" value={`${formatStatValue(player.hp, "health")} / ${formatStatValue(player.maxHp, "max")}`} />
              <InfoRow label="Mana" value={`${formatStatValue(player.mp, "mana")} / ${formatStatValue(player.maxMp, "max")}`} />
              <InfoRow label="Stamina" value={`${formatStatValue(player.stamina, "stamina")} / ${formatStatValue(player.maxStamina, "max")}`} />
              <InfoRow label="Health regen" value={`${formatRegenValue(player.hpRegen)}/s`} />
              <InfoRow label="Stamina regen" value={`${formatRegenValue(player.staminaRegen)}/s`} />
            </div>
            <section className="character-profile-details" aria-label="Profile details">
              <h3>Profile details</h3>
              <div className="character-grid">
                <InfoRow label="Gender" value={player.gender} />
                <InfoRow label="Path" value={player.path} />
                <InfoRow label="Area" value={currentAreaLabel} />
                <InfoRow label="Day" value={player.day} />
              </div>
            </section>
          </section>
          <section className="character-card">
            <h3>Attributes</h3>
            <div className="character-grid">
              {attributeOrder.map((attribute) => <InfoRow key={attribute}
                label={formatAttributeLabel(attribute)} value={player.attributes?.[attribute] ?? 1} />)}
            </div>
          </section>
          <section className="character-card">
            <h3>Resources</h3>
            <InfoRow label={resources.gold.label} value={`${resources.gold.amount}g`} highlight />
            {discoveredResources.map(([id, resource]) => <InfoRow key={id} label={resource.label} value={resource.amount} />)}
            {discoveredResources.length === 0 && <p className="empty-note">No other resources discovered.</p>}
          </section>
        </>}

        {selectedTab === "combat" && <>
          <section className="character-card character-card-wide">
            <h3>Training</h3>
            <div className="combat-training-summary">
              <InfoRow label="Combat Basics" value={combatBasicsUnlocked ? "Unlocked" : "Locked"} highlight={combatBasicsUnlocked} />
              <InfoRow label="Training" value={`${getCombatTrainingRank(combatTraining)} · ${combatTraining}`} />
              <InfoRow label="Basic Guard" value={basicGuardUnlocked ? "Learned" : "Not learned"} highlight={basicGuardUnlocked} />
            </div>
          </section>
          <div className="combat-stat-groups character-card-wide">
            {combatStatGroups.map((group) => <section className="character-card" key={group.label}>
              <h3>{group.label}</h3>
              {group.stats.map((statId) => {
                const bonus = equipmentBonusTotals[statId] || 0;
                const upgradeBonus = upgradeBonusTotals[statId] || 0;
                return <div className="combat-stat" key={statId}>
                  <InfoRow label={formatDerivedCombatStatLabel(statId)}
                    value={formatDerivedCombatStatValue(statId, derivedCombatStats[statId])} />
                  {bonus !== 0 && <small className="combat-gear-bonus">
                    Gear: {bonus > 0 ? "+" : ""}{formatDerivedCombatStatValue(statId, bonus)}
                  </small>}
                  {upgradeBonus !== 0 && <small className="combat-gear-bonus">
                    Upgrades: +{formatDerivedCombatStatValue(statId, upgradeBonus)}
                  </small>}
                </div>;
              })}
            </section>)}
          </div>
          <p className="character-help character-card-wide">
            Totals include attributes, training, unlocks, upgrades, and gear, subject to stat caps.
            Attack, Defense, Guard Power, Accuracy, Evasion, and Critical Chance now affect sparring.
            Initiative, Focus, and Resolve are reserved for future combat abilities.
          </p>
        </>}

        {selectedTab === "upgrades" && <section className="character-card character-card-wide">
          <h3>Upgrades</h3>
          <p className="character-help">Spend gathered resources on permanent improvements. Choose what to develop first; every upgrade can eventually be learned.</p>
          {upgradeGroups.map((group) => <section className="upgrade-group" key={group.id} aria-label={group.label}>
            <header><h3>{group.label}</h3><p className="character-help">{group.description}</p></header>
            <div className="upgrade-list">
              {upgrades.filter((upgrade) => upgrade.category === group.id).map((upgrade) => <UpgradeCard key={upgrade.id} upgrade={upgrade}
                gameState={gameState} onPurchaseUpgrade={onPurchaseUpgrade} />)}
            </div>
          </section>)}
          {upgrades.length === 0 && <p className="empty-note">No upgrades available yet.</p>}
        </section>}

        {selectedTab === "mastery" && <GatheringMasteries gameState={gameState} />}

        {selectedTab === "items" && <div className="character-items-layout character-card-wide">
          <section className="character-card character-appearance" aria-label="Character and equipped gear">
            <header className="character-appearance-header">
              <div><h3>Character</h3><p className="character-appearance-name">{player.name}</p></div>
              <span>Level {player.level}</span>
            </header>
            <ArmorSlotPreview gameState={gameState} onEquipItem={onEquipItem} onUnequipSlot={onUnequipSlot} />
            <h3>Weapon & Accessories</h3>
            <div className="equipment-grid">
              {otherEquipmentSlots.map((slot) => {
                const equippedId = equipment[slot.id];
                const equippedItem = itemMap.get(equippedId);
                return <div key={slot.id} className="equipment-slot">
                  <span className="equipment-slot-label">{slot.label}</span>
                  {equippedId ? <>
                    <strong>{equippedItem?.label || equippedId}</strong>
                    {equippedItem && <EquipmentBonusText item={equippedItem} />}
                    <button type="button" aria-label={`Unequip ${equippedItem?.label || equippedId} from ${slot.label}`}
                      onClick={() => onUnequipSlot(slot.id)}>Unequip</button>
                  </> : <strong className="equipment-empty">Empty</strong>}
                </div>;
              })}
            </div>
          </section>
          <section className="character-card inventory-container" aria-label="Inventory">
            <h3>Inventory</h3>
            <TabBar tabs={inventoryGroups} active={selectedGroup.id} onChange={setInventoryTab}
              id={inventoryTabsId} label="Inventory categories" className="inventory-tabs" />
            <div role="tabpanel" id={`${inventoryTabsId}-panel`}
              aria-labelledby={`${inventoryTabsId}-tab-${selectedGroup.id}`} tabIndex={0}>
              <InventoryPanel key={selectedGroup.id} title={selectedGroup.label} items={selectedGroup.items}
                equipment={equipment} onEquipItem={onEquipItem} onUseItem={onUseItem} />
            </div>
          </section>
        </div>}
      </div>
    </section>
  );
}

function getCombatTrainingRank(training) {
  return training >= 5 ? "Guard Basics" : training > 0 ? "Beginner" : "Untrained";
}
