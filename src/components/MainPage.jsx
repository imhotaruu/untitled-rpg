import { useEffect, useId, useRef, useState } from "react";
import ActionDetails from "./ActionDetails";
import HistoryPanel from "./HistoryPanel";
import StoryPanel from "./StoryPanel";
import Panel from "./ui/Panel";
import ExplorationEncounter from "./ExplorationEncounter";

export default function MainPage({
  player, resources, actionLog, storyLog, currentArea, currentAreaLabel,
  knownLocationGroups, availableActions, onMoveToArea, onAction,
  focusActionId, gatheringMastery, explorationEncounter, onEncounterChoice,
}) {
  const [historyRevision, setHistoryRevision] = useState(0);
  const sceneId = useId();
  const headingRef = useRef(null);
  const focusHeading = Boolean(focusActionId && !availableActions.some((action) => action.id === focusActionId));
  useEffect(() => {
    if (focusHeading) headingRef.current?.focus({ preventScroll: true });
  }, [focusHeading, focusActionId]);

  function showActionHistory() {
    setHistoryRevision((current) => current + 1);
  }

  return <>
    <Panel title="Locations" className="locations-panel">
      <nav className="area-group-list" aria-label="Travel locations">
        {knownLocationGroups.map((group) => (
          <div key={group.category} className="area-group">
            <h3>{group.category}</h3>
            <div className="button-list area-button-list">
              {group.areas.map((area) => (
                area.knowledge === "heard" ? <div key={area.id} className="location-rumor">
                  <span>{area.label}</span>
                  <small>Heard about</small>
                  <p>{area.reason}</p>
                </div> :
                <button key={area.id} type="button"
                  className={area.id === player.area ? "primary" : ""}
                  aria-current={area.id === player.area ? "location" : undefined}
                  disabled={!area.canTravel}
                  title={area.reason || undefined}
                  onClick={() => {
                    showActionHistory();
                    onMoveToArea(area);
                  }}>
                  {area.label}
                  {!area.canTravel && !explorationEncounter && <small className="location-access-note">{area.reason}</small>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </Panel>

    <section className="panel scene-panel" aria-labelledby={sceneId}>
      <header className="scene-header-block">
        <div className="scene-heading">
          <h1 id={sceneId} ref={headingRef} tabIndex={-1}>{currentAreaLabel}</h1>
          <span className="scene-category">{currentArea?.category || "Unknown"}</span>
        </div>
        <p>{currentArea?.description || "You are somewhere unfamiliar. The path ahead is unclear."}</p>
      </header>

      <div className="scene-content-split">
        {explorationEncounter ? <ExplorationEncounter encounter={explorationEncounter}
          resources={resources} onChoose={(token, choiceId) => {
            showActionHistory();
            onEncounterChoice(token, choiceId);
          }} /> : <ActionButtons key={player.area} actions={availableActions} resources={resources}
          gatheringMastery={gatheringMastery}
          focusActionId={focusActionId}
          player={player} onAction={(action) => {
            showActionHistory();
            onAction(action);
          }} />}

        <StoryPanel entries={storyLog} />
      </div>
    </section>

    <HistoryPanel actionLog={actionLog} resetKey={historyRevision} />
  </>;
}

function ActionButtons({ actions, resources, player, onAction, focusActionId, gatheringMastery }) {
  const [previewId, setPreviewId] = useState(null);
  const detailsId = useId();
  const preview = actions.find((action) => action.id === previewId);

  return (
    <section className="scene-actions" aria-label="Available actions">
      <h2>Actions</h2>
      <div className="main-action-grid">
        {actions.map((action) => {
          const isResting = Boolean(action.startsResting && player.isResting);
          return (
            <button key={action.id} type="button"
              autoFocus={action.id === focusActionId}
              className={isResting ? "action-button main-action-button primary" : "action-button main-action-button"}
              data-action-kind={action.encounterId ? "battle" : action.startsResting ? "rest" : action.category || "normal"}
              data-previewed={preview?.id === action.id} disabled={isResting}
              aria-controls={detailsId}
              aria-describedby={preview?.id === action.id ? detailsId : undefined}
              onPointerEnter={() => setPreviewId(action.id)}
              onFocus={() => setPreviewId(action.id)}
              onClick={() => {
                setPreviewId(action.id);
                onAction(action);
              }}>
              {isResting ? "Resting…" : action.label}
            </button>
          );
        })}
      </div>
      {actions.length > 0 ? (
        <div className="action-preview" id={detailsId}>
          {preview ? <>
            <h3>{preview.label}</h3>
            {preview.oneTime && <span className="action-once-label">One-time action</span>}
            <ActionDetails action={preview} resources={resources} gatheringMastery={gatheringMastery} />
          </> : <p className="action-preview-hint">Hover or focus an action to see what it does. Click to perform it.</p>}
        </div>
      ) : <p className="empty-note">No actions available here yet. You can visit another location.</p>}
    </section>
  );
}
