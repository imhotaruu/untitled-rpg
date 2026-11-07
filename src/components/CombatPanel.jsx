import { useEffect, useId, useRef, useState } from "react";
import { getCombatIntent } from "../engine/combatSystem";
import BattlePartyStrip from "./BattlePartyStrip";
import CombatOverlay from "./CombatOverlay";
import BattleCommands from "./BattleCommands";
import useHitReaction from "./useHitReaction";
import LogScrollControl from "./ui/LogScrollControl";
import StatMeter from "./ui/StatMeter";
import { encounters } from "../data/encounters";
import BattleTutorialHelper from "./BattleTutorialHelper";
import SealTransitionDialog from "./SealTransitionDialog";
import BattleInfoBadge from "./BattleInfoBadge";
import BattleInfoPanel from "./BattleInfoPanel";
import PartyMemberProfile from "./PartyMemberProfile";

const sparOutcomeLabels = { victory: "Spar won", defeat: "Spar lost", retreat: "Spar ended" };

export default function CombatPanel({ combat, onMove, onDismiss, magicUnlocked, inventory, busy = false, frame = null, reducedMotion = false, dialogueActive = false }) {
  const tutorial = encounters[combat.encounterId].tutorial;
  const outcomeLabels = tutorial ? { victory: "The way is open", defeat: "An ally answers", retreat: "Together at the veil" } : sparOutcomeLabels;
  const [preview, setPreview] = useState({ label: "Commands", description: "Choose a category or a defensive move." });
  const [overlay, setOverlay] = useState(null);
  const [infoTarget, setInfoTarget] = useState("enemy");
  const [awayFromLatest, setAwayFromLatest] = useState(false);
  const headingRef = useRef(null);
  const logRef = useRef(null);
  const detailsId = useId();
  const enemyRef = useHitReaction(combat.enemy.hp, frame?.actor === "enemy" ? frame : null, reducedMotion);
  const active = combat.status === "active";
  const intent = getCombatIntent(combat);
  const latest = combat.log[0] || { round: 0, messages: ["Choose a command when you are ready."] };
  const message = frame?.message || latest.messages.at(-1);
  const partyMembers = [{ ...combat.player, id: "player" }];

  useEffect(() => {
    if (!dialogueActive) headingRef.current?.focus({ preventScroll: true });
  }, [combat.status, dialogueActive]);

  function openOverlay(type, targetId = "enemy") {
    if (busy) return;
    setAwayFromLatest(false);
    if (type === "info" || type === "profile") setInfoTarget(targetId);
    setOverlay(type);
  }

  function jumpToLatest() {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
      logRef.current.focus({ preventScroll: true });
    }
    setAwayFromLatest(false);
  }

  return <div className="combat-layout">
    <section className="battle-stage" aria-label="Battlefield">
      <header className="battle-stage-header">
        <h2 ref={headingRef} tabIndex={-1} className="battle-turn-banner">
          {busy ? `${frame.actor === "enemy" ? `${combat.enemy.name}'s turn` : "Resolving your move"} / ${String(combat.round).padStart(2, "0")}`
            : active ? `Your turn / ${String(combat.round).padStart(2, "0")}` : outcomeLabels[combat.status]}
        </h2>
        <div className="battle-tools" role="group" aria-label="Battle information">
          <button type="button" disabled={busy} aria-haspopup="dialog" onClick={() => openOverlay("info")}>Info</button>
          <button type="button" disabled={busy} aria-haspopup="dialog" onClick={() => openOverlay("log")}>Battle Log</button>
        </div>
      </header>

      <div className="battle-field-content">
      {tutorial && !dialogueActive && !busy && <BattleTutorialHelper combat={combat} />}
      <div className="battle-enemy" data-defeated={combat.enemy.hp === 0}>
        <div className="enemy-presentation">
        <div className="enemy-figure" ref={enemyRef} aria-hidden="true">
          <span className="enemy-figure-aura" />
          <span className="portrait-silhouette"><span /></span>
          <span className="enemy-figure-ground" />
        </div>
        {active && !dialogueActive && <div className="enemy-indicators" aria-label={`${combat.enemy.name}'s intent and effects`}>
          {!busy && <BattleInfoBadge key={`intent-${combat.round}`} symbol="!"
            label={tutorial ? "Enemy intent" : `Next move · ${intent.label}`} description={intent.description} />}
          {tutorial && combat.enemy.evasion === 75 && <BattleInfoBadge symbol="↑" kind="buff"
            label="Evasive" description="The fragment's shifting form increases its evasion to 75%. Guiding Star can guide your next physical strike to its target." />}
        </div>}
        </div>
        <div className="enemy-nameplate">
          <h3>{combat.enemy.name}</h3>
          <StatMeter label="HP" value={combat.enemy.hp} max={combat.enemy.maxHp} type="health" />
        </div>
      </div>
      <aside className="battle-updates" aria-label="Latest battle action">
        <div className="battle-message" key={frame?.id || `${latest.round}-${combat.status}`}>
          <span className="battle-message-label">{busy ? `Turn ${combat.round}` : latest.round ? `Turn ${latest.round}` : "Opening"}</span>
          <p>{message}</p>
        </div>
      </aside>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message}
        {!busy && (active ? ` Your turn. ${intent.description}` : ` ${outcomeLabels[combat.status]}.`)}
      </p>
    </section>

    <div className="battle-dock">
      <section className="battle-commands" aria-label="Battle commands">
        {active ? <BattleCommands combat={combat} magicUnlocked={magicUnlocked} inventory={inventory}
          busy={busy} onMove={onMove} onPreview={setPreview} detailsId={detailsId} /> : !tutorial && <div className="battle-result">
          <h2>{outcomeLabels[combat.status]}</h2>
          <p>Your adventure health, stamina, and items are unchanged.</p>
          <button className="primary" type="button" onClick={onDismiss}>Return to Adventure</button>
        </div>}
      </section>

      <BattlePartyStrip members={partyMembers} activeMemberId={active && (!busy || frame?.actor === "player") ? "player" : null}
        busy={busy} frame={frame} reducedMotion={reducedMotion} finished={!active} onProfile={(memberId) => openOverlay("profile", `party:${memberId}`)} />

      {(active || !tutorial) && <aside className="battle-command-guide" aria-label={active ? "Command description" : "Practice results"}>
        {busy ? <div id={detailsId}><h3>Turn in progress</h3><p>Watch the exchange. Commands return when the turn finishes.</p></div> : active ? <div id={detailsId}>
          <h3>{preview.label}</h3><p>{preview.description}</p>
          {combat.player.stamina < preview.cost && <p className="battle-cost-warning">Not enough stamina. Guard or Recover to regain it.</p>}
        </div> : <div><h3>{outcomeLabels[combat.status]}</h3><p>You can return to the adventure whenever you are ready.</p></div>}
        {!tutorial && <p className="battle-practice-note">Practice bout · Separate vitals<br />No rewards or lasting injuries</p>}
        {combat.tutorial?.guided && <p className="battle-buff">Guiding Star · Next physical strike guaranteed to hit</p>}
      </aside>}
    </div>

    {tutorial && !active && !busy && !dialogueActive && <SealTransitionDialog onContinue={onDismiss} reducedMotion={reducedMotion} />}

    {overlay && <CombatOverlay title={overlay === "log" ? "Battle Log" : overlay === "profile" ? "Party Profile" : "Battle Info"}
      className={overlay !== "log" ? "battle-info-overlay" : ""} onClose={() => setOverlay(null)}>
      {overlay === "log" ? <>
        <div className="battle-log-tools"><LogScrollControl canJump={awayFromLatest} onJump={jumpToLatest} /></div>
        <div className="story-reader battle-log-reader" ref={logRef} role="region" aria-label="Combat history"
          tabIndex={0} onScroll={(event) => setAwayFromLatest(event.currentTarget.scrollTop > 8)}>
          <ol className="story-passages">
            {combat.log.map((entry, index) => <li className="story-passage" key={entry.round} data-latest={index === 0}>
              <span className="story-latest-label">{entry.round ? `Turn ${entry.round}` : "Opening"}{index === 0 ? " · Latest" : ""}</span>
              {entry.messages.map((message, messageIndex) => <p key={messageIndex}>{message}</p>)}
            </li>)}
          </ol>
        </div>
      </> : overlay === "profile" ? <PartyMemberProfile combat={combat} partyMembers={partyMembers} targetId={infoTarget} />
        : <BattleInfoPanel combat={combat} partyMembers={partyMembers} initialTargetId={infoTarget} />}
    </CombatOverlay>}
  </div>;
}
