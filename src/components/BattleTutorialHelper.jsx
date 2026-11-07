import { divinePhases, getDivinePhase } from "../data/divineTutorial";

export default function BattleTutorialHelper({ combat }) {
  const phase = getDivinePhase(combat);
  if (!phase || combat.status !== "active") return null;
  return <aside className="battle-tutorial-helper" aria-label="Tutorial helper">
    <span className="tutorial-helper-step">Tutorial · {divinePhases.indexOf(phase) + 1} / {divinePhases.length}</span>
    <h3>{phase.label}</h3>
    <p className="tutorial-helper-objective">{phase.objective}</p>
  </aside>;
}
