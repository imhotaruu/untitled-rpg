import { useId, useState } from "react";
import { getBattleInfoEntries } from "../engine/battleInfoSystem";
import BattleCombatantDetails from "./BattleCombatantDetails";

export default function BattleInfoPanel({ combat, partyMembers, initialTargetId = "enemy" }) {
  const entries = getBattleInfoEntries(combat, partyMembers);
  const [selectedId, setSelectedId] = useState(initialTargetId);
  const selected = entries.find((entry) => entry.key === selectedId) || entries[0];
  const contentId = useId();

  return <div className="battle-info-layout">
    <nav className="battle-info-roster" aria-label="Inspect a combatant">
      {[{ id: "enemy", label: "Enemy" }, { id: "party", label: "Party" }].map((group) => <section key={group.id} aria-label={group.label}>
        <h3>{group.label}</h3>
        {entries.filter((entry) => entry.side === group.id).map((entry) => <button type="button" key={entry.key}
          aria-pressed={selected.key === entry.key} aria-controls={contentId} onClick={() => setSelectedId(entry.key)}>
          <span className="battle-info-initial" aria-hidden="true">{entry.name.slice(0, 1)}</span>
          <span>{entry.name}</span>
        </button>)}
      </section>)}
    </nav>
    <BattleCombatantDetails entry={selected} id={contentId} />
  </div>;
}
