export const divineMoves = [
  { id: "attack", label: "Starward Slash", category: "physical", cost: 1, description: "Sweep Starwake, Astraea's celestial blade, through the enemy in an arc of starlight." },
  { id: "astral_ward", label: "Astral Ward", category: "magic", cost: 0, manaCost: 4, description: "A shield of starlight reduces the next incoming attack's damage by 75%." },
  { id: "guiding_star", label: "Guiding Star", category: "magic", cost: 0, manaCost: 3, description: "Celestial light reveals the fragment's movements. Your next physical strike is guaranteed to hit." },
  { id: "starlight_mend", label: "Starlight Mend", category: "magic", cost: 0, manaCost: 5, description: "Restore up to 12 health. Healing cannot exceed your maximum health." },
  { id: "celestial_severance", label: "Celestial Severance", category: "magic", cost: 0, manaCost: 8, description: "Channel divine star magic through Starwake to destroy the weakened fragment." },
];

export const divinePhases = [
  { id: "strike", moveId: "attack", label: "Basic combat", objective: "Open Attack and use Starward Slash.", intent: "The fragment lunges. Meet it with your blade." },
  { id: "ward", moveId: "astral_ward", label: "Defensive magic", objective: "Open Magic and cast Astral Ward to soften the coming wave of darkness.", intent: "Dark energy gathers between its claws. A powerful wave is coming." },
  { id: "guidance", moveId: "guiding_star", label: "Support magic", objective: "Cast Guiding Star to reveal the fragment's erratic movements.", intent: "The fragment flickers across the battlefield, difficult to follow." },
  { id: "guided_strike", moveId: "attack", label: "Follow the light", objective: "Return to Attack and use Starward Slash to follow up your spell.", intent: "The star reveals a path through the shifting darkness." },
  { id: "mend", moveId: "starlight_mend", label: "Restoration magic", objective: "Cast Starlight Mend to restore Astraea's health.", intent: "The wounded fragment gathers itself. A moment to heal." },
  { id: "finisher", moveId: "celestial_severance", label: "Divine star magic", objective: "Cast Celestial Severance to end the battle.", intent: "The fragment charges as the others hold the seal. Finish it with Starwake." },
];

export function getDivinePhase(combat) {
  return divinePhases.find((phase) => phase.id === combat?.tutorial?.phase) || null;
}

export function isDivineMoveAvailable(combat, moveId) {
  return combat?.status === "active" && !combat.tutorial?.reading
    && getDivinePhase(combat)?.moveId === moveId;
}
