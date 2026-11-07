import { recipes } from "../data/recipes";
import { canPayResourceCost, payResourceCost } from "./resourceSystem";
import { grantItemRewards } from "./itemSystem";
import { isCraftingUnlocked } from "./questSystem";
import { processUnlocks } from "./unlockSystem";

export function normalizeCrafting(value) {
  return { crafted: Object.fromEntries(recipes.map((recipe) => [recipe.id,
    Number.isSafeInteger(value?.crafted?.[recipe.id]) && value.crafted[recipe.id] > 0 ? 1 : 0])) };
}

export function getCraftingBlockReason(state, recipeId) {
  const recipe = recipes.find((entry) => entry.id === recipeId);
  if (!recipe) return "Unknown recipe.";
  if (!isCraftingUnlocked(state)) return "Accept Rowan's crafting lesson first.";
  if (state.combat) return "Finish the battle before crafting.";
  if (state.conversation) return "Finish the conversation before crafting.";
  if (state.exploration?.pending) return "Resolve your exploration encounter before crafting.";
  if (state.crafting?.crafted?.[recipeId] > 0) return "You have already crafted this piece of equipment.";
  if (state.inventory?.items?.some((entry) => (entry.itemId || entry.id) === recipe.itemId)
    || Object.values(state.equipment || {}).includes(recipe.itemId)) return "You already own this piece of equipment.";
  if (state.player.area !== recipe.areaId) return "Return to Village Square to use Rowan's workbench.";
  if (!canPayResourceCost(state.resources, recipe.materials)) return "Gather the missing materials before crafting.";
  return null;
}

export function craftItem(state, recipeId) {
  const reason = getCraftingBlockReason(state, recipeId);
  if (reason) return state;
  const recipe = recipes.find((entry) => entry.id === recipeId);
  const next = structuredClone(state);
  payResourceCost(next.resources, recipe.materials);
  const itemLogs = grantItemRewards(next, [{ itemId: recipe.itemId, quantity: 1 }]);
  next.crafting = normalizeCrafting(next.crafting);
  next.crafting.crafted[recipe.id] = 1;
  next.player.isResting = false;
  const spent = Object.entries(recipe.materials).map(([id, amount]) => `${amount} ${next.resources[id].label}`).join(", ");
  next.actionLog = [{ type: "item", message: `Crafted ${recipe.label}. Used ${spent}.` }, ...itemLogs, ...next.actionLog].slice(0, 50);
  next.storyLog = ["The blade takes shape slowly beneath your hands. When you bind the grip and lift it from the bench, the small imperfections feel familiar: each one belongs to your first attempt. Rowan turns it over with an approving nod.", ...next.storyLog].slice(0, 50);
  processUnlocks(next);
  return next;
}
