import { recipes } from "../data/recipes";
import { items } from "../data/items";
import { getCraftingBlockReason } from "../engine/craftingSystem";
import { getQuestStatus, isCraftingUnlocked } from "../engine/questSystem";
import EquipmentBonusText from "./ui/EquipmentBonusText";

export default function CraftingPage({ gameState, onCraft, onOpenItems }) {
  const unlocked = isCraftingUnlocked(gameState);
  return <section className="character-page-panel activity-page" aria-labelledby="crafting-title">
    <header className="activity-heading"><h1 id="crafting-title">Crafting</h1><p>A little patience. Something made by your own hands.</p></header>
    <div className="activity-content">
      {!unlocked ? <p>Recipes will appear when someone teaches you a craft.</p> : <>
        <p className="activity-help">Workbench: Village Square · Each piece of equipment can be crafted once.</p>
        {recipes.map((recipe) => {
          const item = items.find((entry) => entry.id === recipe.itemId);
          const reason = getCraftingBlockReason(gameState, recipe.id);
          const crafted = gameState.crafting?.crafted?.[recipe.id] > 0;
          const finished = getQuestStatus(gameState, "rowan_first_craft") === "completed";
          return <article className="activity-card" key={recipe.id}>
            <span className="activity-eyebrow">Rowan's first lesson · Weapon</span>
            <h2>{recipe.label}</h2><p>{recipe.description}</p>
            <EquipmentBonusText item={item} />
            <h3>{crafted ? "Materials used" : "Materials"}</h3>
            <ul className="crafting-materials" aria-label="Owned and required materials">
              {Object.entries(recipe.materials).map(([id, required]) => {
                const resource = gameState.resources[id];
                const owned = resource?.amount || 0;
                return <li key={id} data-missing={!crafted && owned < required}>
                  <strong>{resource?.label || id}</strong><span>{crafted ? `${required} used` : <>{owned} / {required} <small>{owned < required ? "Missing materials" : "Ready"}</small></>}</span>
                </li>;
              })}
            </ul>
            <div className="activity-actions">
              <button type="button" disabled={Boolean(reason)} aria-describedby={`craft-${recipe.id}-status`}
                onClick={() => onCraft(recipe.id)}>{crafted ? "Crafted" : "Craft Sword"}</button>
              {crafted && <button type="button" onClick={onOpenItems}>View in Items</button>}
            </div>
            <p id={`craft-${recipe.id}-status`} className="activity-help">{crafted ? finished ? "Your lesson is complete. Your sword is in Character → Items, ready to equip." : "Your sword is in Character → Items, ready to equip. Show your work to Rowan to finish the quest." : reason || "Uses 4 Wood and 1 Cloth. Your sword will be added to Character → Items."}</p>
          </article>;
        })}
      </>}
    </div>
  </section>;
}
