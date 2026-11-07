import { quests } from "../data/quests";
import { recipes } from "../data/recipes";
import { villagePeople } from "../data/relationships";
import { getQuestStatus } from "../engine/questSystem";

export default function QuestsPage({ gameState, onChangePage }) {
  const known = quests.map((quest) => ({ ...quest, status: getQuestStatus(gameState, quest.id) })).filter((quest) => quest.status !== "locked");
  return <section className="character-page-panel activity-page" aria-labelledby="quests-title">
    <header className="activity-heading"><h1 id="quests-title">Quests</h1><p>The work you take on, and the promises you keep.</p></header>
    <div className="activity-content">
      {!known.length && <p>No quests yet. The people you get to know may have something to share with you.</p>}
      {[["Active", ["active", "ready"]], ["Available", ["available"]], ["Completed", ["completed"]]].map(([heading, statuses]) => {
        const group = known.filter((quest) => statuses.includes(quest.status));
        return group.length ? <section className="quest-group" key={heading} aria-label={`${heading} quests`}>
          <h2>{heading}</h2>
          {group.map((quest) => {
            const recipe = recipes.find((entry) => entry.id === quest.recipeId);
            const ready = quest.status === "ready" || quest.status === "completed";
            return <article className="activity-card" key={quest.id}>
              <span className="activity-eyebrow">{villagePeople[quest.giverId].name} · Village Square</span>
              <h3>{quest.title}</h3><p>{quest.description}</p>
              {quest.status === "available" ? <p>Speak to Rowan at Village Square to accept the lesson. They will provide 1 Cloth for the grip.</p> : <ol className="quest-objectives">
                <li data-done={ready}>{ready ? "✓" : "○"} Craft a {recipe.label} <strong>{ready ? "1 / 1" : "0 / 1"}</strong></li>
                <li data-done={quest.status === "completed"}>{quest.status === "completed" ? "✓" : "○"} Show your work to Rowan</li>
              </ol>}
              {quest.status === "active" && <p className="activity-help">Materials: {Object.entries(recipe.materials).map(([id, amount]) => `${gameState.resources[id].label} ${gameState.resources[id].amount} / ${amount}`).join(" · ")}. Gather Wood at Forest Trail, then craft at Village Square.</p>}
              {quest.status === "ready" && <p>Your sword is ready. Choose “Show Your Work to Rowan” at Village Square.</p>}
              <p className="quest-reward">{quest.status === "completed" ? "Reward received" : "Reward"}: 5 Gold · Keep your handmade sword</p>
              {quest.status !== "completed" && <div className="activity-actions"><button type="button" onClick={() => onChangePage(quest.status === "active" ? "crafting" : "main")}>{quest.status === "active" ? "Open Crafting" : "Back to Main"}</button></div>}
            </article>;
          })}
        </section> : null;
      })}
    </div>
  </section>;
}
