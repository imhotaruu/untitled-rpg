import { useLayoutEffect, useRef } from "react";
import StatMeter from "./ui/StatMeter";
import useHitReaction from "./useHitReaction";

export default function BattlePartyStrip({ members, activeMemberId, finished, onProfile, busy = false, frame = null, reducedMotion = false }) {
  return <section className="battle-party" aria-label="Party status">
    <div className="battle-party-strip" data-reduced-motion={reducedMotion}>
      {members.map((member) => <div className="battle-party-seat" key={member.id}><PartyPortrait member={member}
        active={member.id === activeMemberId} finished={finished} onProfile={onProfile} busy={busy} reducedMotion={reducedMotion}
        cue={member.id === "player" && frame?.actor === "player" ? frame : null} /></div>)}
    </div>
  </section>;
}

function PartyPortrait({ member, active, finished, onProfile, busy, cue, reducedMotion }) {
  const portraitRef = useHitReaction(member.hp, cue, reducedMotion);
  const cardRef = useRef(null);
  const overviewRef = useRef(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    const overview = overviewRef.current;
    function measureRecess() {
      const cardBox = card.getBoundingClientRect();
      const overviewBox = overview.getBoundingClientRect();
      // Keep the full name, turn label, and portrait above the dock, plus a small lip.
      // Measuring each card also handles wrapped names and differing meter counts.
      const recess = Math.max(0, cardBox.bottom - overviewBox.bottom - 4);
      card.style.setProperty("--party-card-recess", `${recess}px`);
    }
    measureRecess();
    const observer = new ResizeObserver(measureRecess);
    observer.observe(card);
    observer.observe(overview);
    return () => observer.disconnect();
  }, []);

  return <article ref={cardRef} className="battle-party-card" data-active={active} data-waiting={!active && !finished}>
      <div ref={overviewRef} className="party-card-overview">
        <h3>{member.name}</h3>
        <span className="party-turn-label">{finished ? "Battle ended" : active ? busy ? "Acting" : "Your turn" : "Waiting"}</span>
        <button type="button" className="party-portrait" ref={portraitRef} disabled={busy} onClick={() => onProfile(member.id)}
          aria-label={`View ${member.name}'s profile`} aria-haspopup="dialog">
          <span className="portrait-silhouette" aria-hidden="true"><span /></span>
        </button>
      </div>
        <StatMeter label="HP" value={member.hp} max={member.maxHp} type="health" />
        <StatMeter label="ST" value={member.stamina} max={member.maxStamina} type="stamina" />
        {Number.isFinite(member.maxMp) && <StatMeter label="MP" value={member.mp} max={member.maxMp} type="mana" />}
      </article>;
}
