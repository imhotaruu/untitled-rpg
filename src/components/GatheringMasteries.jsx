import { gatheringMasteries } from "../data/gatheringMasteries";
import { getGatheringProgress, getGatheringBonus } from "../engine/gatheringSystem";
import InfoRow from "./ui/InfoRow";

export default function GatheringMasteries({ gameState }) {
  const discovered = gatheringMasteries.filter(({ resourceId }) =>
    getGatheringProgress(gameState, resourceId).started);
  return <section className="character-card character-card-wide gathering-masteries" aria-label="Gathering mastery">
    <header><h3>Gathering mastery</h3>
      <p className="character-help">Earn 1 XP per successful gather. Level 1 takes 100 XP; each following level takes twice as much. Every level adds +1 to future gathers of that resource.</p>
    </header>
    <div className="upgrade-list">
      {discovered.map((mastery) => {
        const { level, xp, xpRequired, maxed } = getGatheringProgress(gameState, mastery.resourceId);
        const label = gameState.resources[mastery.resourceId]?.label || mastery.resourceId;
        return <article className="mastery-card" key={mastery.resourceId}>
          <div className="upgrade-card-header"><h4>{mastery.label}</h4><span>Level {level} / {mastery.maxLevel}</span></div>
          <InfoRow label="Gathering bonus" value={`+${getGatheringBonus(gameState, mastery.resourceId)} ${label}`} />
          <div className="mastery-xp">
            <InfoRow label={maxed ? "Mastered" : `Toward Level ${level + 1}`} value={maxed ? "Max level" : `${xp} / ${xpRequired} XP`} />
            <progress value={maxed ? 1 : xp} max={maxed ? 1 : xpRequired}
              aria-label={`${mastery.label} experience`}
              aria-valuetext={maxed ? "Maximum mastery level reached" : `${xp} of ${xpRequired} XP toward Level ${level + 1}`} />
          </div>
          <p className="character-help">{maxed ? "Mastered — maximum bonus reached."
            : `Next level: +${(level + 1) * mastery.bonusPerLevel} ${label} per gather.`}</p>
          <p className="character-help">Critical gather: {mastery.criticalChance * 100}% chance for ×{mastery.criticalMultiplier} yield. XP stays the same.</p>
        </article>;
      })}
    </div>
    {!discovered.length && <p className="empty-note">Gather resources to discover their masteries.</p>}
  </section>;
}
