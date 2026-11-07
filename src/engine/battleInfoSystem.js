import { encounters } from "../data/encounters";
import { getCombatIntent, getHitChance } from "./combatSystem";

// Inspect combat snapshots; never substitute the adventure character's vitals.
export function getBattleInfoEntries(combat, partyMembers = [{ ...combat.player, id: "player" }]) {
  const tutorial = Boolean(encounters[combat.encounterId]?.tutorial);
  const active = combat.status === "active";
  const subjects = [
    { key: "enemy", side: "enemy", member: combat.enemy },
    ...partyMembers.map((member) => ({ key: `party:${member.id}`, side: "party", member })),
  ];

  return subjects.map(({ key, side, member }) => {
    const target = side === "party" ? combat.enemy : partyMembers.length === 1 ? partyMembers[0] : null;
    const effects = [];
    if (active && tutorial && side === "enemy" && member.evasion === 75) {
      effects.push({ label: "Evasive", description: "Shifting form increases evasion to 75%." });
    }
    if (active && tutorial && key === "party:player" && combat.tutorial?.guided) {
      effects.push({ label: "Guiding Star", description: "The next physical strike is guaranteed to hit." });
    }
    return {
      key, side, name: member.name,
      role: side === "enemy" ? "Enemy" : (member.isLeader ?? member.id === "player") ? "Party Member · Leader" : "Party Member",
      vitals: [
        { label: "Health", value: member.hp, max: member.maxHp, type: "health" },
        { label: "Stamina", value: member.stamina, max: member.maxStamina, type: "stamina" },
        { label: "Mana", value: member.mp, max: member.maxMp, type: "mana" },
      ].filter((vital) => Number.isFinite(vital.value) && Number.isFinite(vital.max) && vital.max > 0),
      stats: [
        ["Attack Power", member.attackPower], ["Defense", member.defense], ["Guard Power", member.guardPower],
        ["Accuracy", member.accuracy, "%"], ["Evasion", member.evasion, "%"], ["Critical chance", member.criticalChance, "%"],
      ].filter(([, value]) => Number.isFinite(value)).map(([label, value, suffix = ""]) => ({ label, value: `${value}${suffix}` })),
      hitChance: target ? {
        target: target.name,
        value: tutorial ? "Guaranteed (tutorial)" : `${getHitChance(member, target)}%`,
      } : null,
      effects,
      intent: side === "enemy" && active ? getCombatIntent(combat) : null,
      note: tutorial ? "Tutorial battle" : "Practice bout · Separate battle vitals",
    };
  });
}
