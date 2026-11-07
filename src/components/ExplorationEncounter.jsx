import { useEffect, useRef } from "react";

export default function ExplorationEncounter({ encounter, resources, onChoose }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [encounter.token]);

  return <section className="exploration-encounter" data-rarity={encounter.rarity} aria-labelledby="exploration-title">
    <span className="exploration-rarity">{encounter.rarity === "rare" ? "Rare encounter" : "Encounter"}</span>
    <h2 id="exploration-title" ref={heading} tabIndex={-1}>{encounter.title}</h2>
    <p>{encounter.text}</p>
    <div className="exploration-choices">
      {encounter.choices.map((choice) => <button key={choice.id} type="button"
        onClick={() => onChoose(encounter.token, choice.id)}>
        <strong>{choice.label}</strong>
        <span>{choice.rewards ? Object.entries(choice.rewards).map(([id, amount]) => `+${amount} ${resources[id]?.label || id}`).join(" · ") : "Continue without taking anything"}</span>
      </button>)}
    </div>
    <p className="exploration-hint">Choose how to respond before moving on. No additional stamina cost.</p>
  </section>;
}
