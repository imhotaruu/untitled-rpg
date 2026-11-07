import { divineMoves } from "./divineTutorial";

export const encounters = {
  chaos_fragment: {
    id: "chaos_fragment", label: "Starwake — The Goddess of Stars", area: "divine_veil", requiredSystem: "prologue_only",
    tutorial: true,
    opponent: { name: "Fragment of Chaos", maxHp: 38, attackPower: 7, defense: 1, guardPower: 0, accuracy: 95, evasion: 0, criticalChance: 0 },
  },
  garron_spar: {
    id: "garron_spar",
    label: "Spar with Garron",
    area: "stonefield_house",
    requiredSystem: "basic_guard",
    opponent: {
      name: "Garron",
      maxHp: 24,
      attackPower: 7,
      defense: 3,
      guardPower: 2,
      accuracy: 90,
      evasion: 5,
      criticalChance: 0,
    },
    intents: [
      { label: "Measured strike", description: "Garron prepares a controlled strike.", kind: "attack", multiplier: 1 },
      { label: "Winding up", description: "Garron draws his weapon back. He will not attack this turn.", kind: "wait" },
      { label: "Heavy strike", description: "Garron commits to a powerful swing.", kind: "attack", multiplier: 1.8 },
      { label: "Catching his breath", description: "Garron pauses to reset his stance. He will not attack this turn.", kind: "wait" },
    ],
  },
};

export const combatMoves = [
  { id: "attack", label: "Attack", category: "physical", cost: 1, multiplier: 1, description: "A measured strike using your Attack Power." },
  { id: "heavy_strike", label: "Heavy Strike", category: "physical", cost: 3, multiplier: 1.6, description: "Strike with 160% Attack Power. Uses the same hit chance as Attack." },
  { id: "guard", label: "Guard", cost: 0, restore: 1, description: "Add Guard Power to your defense for this turn. Restore 1 sparring stamina." },
  { id: "recover", label: "Recover", cost: 0, restore: 3, description: "Restore 3 sparring stamina. Garron still takes his turn." },
];

export function getCombatMoves(combat) {
  return combat?.encounterId === "chaos_fragment" ? divineMoves : combatMoves;
}
