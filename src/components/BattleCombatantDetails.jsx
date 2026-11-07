import { useId } from "react";
import StatMeter from "./ui/StatMeter";

export default function BattleCombatantDetails({ entry, id }) {
  const headingId = useId();
  return <section id={id} className="battle-info-content" aria-labelledby={headingId}>
    <header className="battle-info-heading">
      <span>{entry.role}</span>
      <h3 id={headingId} aria-live="polite">{entry.name}</h3>
      <p>{entry.note}</p>
    </header>
    <div className="combat-vitals">
      {entry.vitals.map((vital) => <StatMeter key={vital.type} {...vital} />)}
    </div>
    <dl className="combat-stat-details">
      {entry.stats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
    </dl>
    {entry.hitChance && <p className="battle-info-hit-chance">Physical hit chance against {entry.hitChance.target}: <strong>{entry.hitChance.value}</strong></p>}
    <section className="battle-info-effects" aria-label="Active effects">
      <h4>Active effects</h4>
      {entry.effects.length ? entry.effects.map((effect) => <p key={effect.label}><strong>{effect.label}</strong> — {effect.description}</p>) : <p>None</p>}
    </section>
    {entry.intent && <section className="battle-info-intent" aria-label="Enemy intent">
      <h4>Next move</h4><p>{entry.intent.description}</p>
    </section>}
  </section>;
}
