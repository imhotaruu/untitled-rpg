import { useContext, useEffect, useRef, useState } from "react";
import { prologueScenes, prologueTitle } from "../data/prologue";
import NarrativePassage from "./NarrativePassage";
import BirthSceneForm from "./BirthSceneForm";
import PrologueSkipDialog from "./PrologueSkipDialog";
import DialogueHistoryButton from "./DialogueHistoryButton";
import { DialogueHistoryContext } from "./dialogueHistoryContext";

export default function PrologueScreen({ narrative, replay, onAdvance, onSkip, onExit, onOpenModal, reducedMotion, textSpeed = "normal", onIdentityChange, onCompleteBirth, paused = false }) {
  const scene = prologueScenes.find((entry) => entry.id === narrative.sceneId) || prologueScenes[0];
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [birthStage, setBirthStage] = useState("narration");
  const [pendingExit, setPendingExit] = useState(null);
  const exitRequested = useRef(false);
  const exitCompleted = useRef(false);
  const history = useContext(DialogueHistoryContext);
  const transitionPaused = paused || confirmSkip || Boolean(history?.open);
  const [openingStage, setOpeningStage] = useState(scene.chapter ? "title" : narrative.sceneId === prologueScenes[0].id ? "begin" : "story");
  const titleKicker = scene.chapter ? scene.speaker : "Prologue";
  const titleName = scene.chapter ? scene.title : prologueTitle;
  const started = openingStage === "story";
  const heading = useRef(null);
  const begin = useRef(null);
  useEffect(() => {
    (started ? heading.current : begin.current)?.focus({ preventScroll: true });
    heading.current?.closest(".prologue-screen")?.scrollTo(0, 0);
  }, [scene.id, started, openingStage]);
  useEffect(() => {
    if (birthStage !== "leaving" || transitionPaused) return;
    const timer = setTimeout(() => setBirthStage("form"), reducedMotion ? 0 : 320);
    return () => clearTimeout(timer);
  }, [birthStage, transitionPaused, reducedMotion]);
  useEffect(() => {
    if (!pendingExit || transitionPaused) return;
    const timer = setTimeout(() => {
      if (exitCompleted.current) return;
      exitCompleted.current = true;
      if (pendingExit.kind === "birth") onCompleteBirth(pendingExit.identity);
      else onAdvance(scene.id);
    }, reducedMotion ? 0 : 320);
    return () => clearTimeout(timer);
  }, [pendingExit, transitionPaused, reducedMotion, onCompleteBirth, onAdvance, scene.id]);

  function leaveScene(kind, identity) {
    if (exitRequested.current) return;
    exitRequested.current = true;
    if (reducedMotion) {
      exitCompleted.current = true;
      if (kind === "birth") onCompleteBirth(identity);
      else onAdvance(scene.id);
    } else setPendingExit({ kind, identity: identity ? { ...identity } : null });
  }
  return <main className="prologue-screen" aria-label={titleName} data-reduced-motion={reducedMotion}
    onClick={(event) => {
      if (!started || transitionPaused || pendingExit || birthStage !== "narration" || event.target.closest("button, input, select, textarea, a, details, dialog, [role='dialog']")) return;
      event.currentTarget.querySelector(".narrative-screen-button")?.click();
    }}>
    <header className="prologue-toolbar">
      <div className="top-actions">
        <DialogueHistoryButton disabled={paused || confirmSkip} />
        <details className="prologue-options">
          <summary>Options</summary>
          <div className="prologue-options-menu">
            <button type="button" onClick={() => onOpenModal("settings")}>Settings</button>
            {!replay && <button type="button" onClick={() => onOpenModal("save")}>Save</button>}
            {!replay && <button type="button" onClick={() => onOpenModal("load")}>Load</button>}
          </div>
        </details>
        {replay ? <button type="button" onClick={onExit}>Exit Replay</button>
          : scene.scene && <button type="button" onClick={() => setConfirmSkip(true)}>Skip Prologue</button>}
      </div>
    </header>
    {!started ? <button type="button" ref={begin} className={openingStage === "begin" ? "prologue-begin" : "prologue-begin prologue-title-card"}
      aria-label={openingStage === "begin" ? "Click to Begin" : `${titleKicker}: ${titleName}. Begin the story.`} disabled={paused || confirmSkip}
      onKeyDown={(event) => { if (event.repeat && ["Enter", " "].includes(event.key)) event.preventDefault(); }}
      onClick={() => setOpeningStage(openingStage === "begin" ? "title" : "story")}>
      {openingStage === "begin" ? <span>Click to Begin</span> : <span className="prologue-title-content">
        <span className="prologue-title-kicker">{titleKicker}</span>
        <span className="prologue-title-name">{titleName}</span>
        <span className="prologue-title-arrow" aria-hidden="true">▾</span>
      </span>}
    </button> : scene.creation && birthStage === "form" ? <section className="birth-identity-screen"
      aria-label="Character creation" data-animated={!reducedMotion} data-paused={transitionPaused} data-exiting={Boolean(pendingExit)}>
      <BirthSceneForm draft={narrative.characterDraft} replay={replay} onChange={onIdentityChange}
        disabled={Boolean(pendingExit)} onComplete={(identity) => leaveScene("birth", identity)} />
    </section> : <section className="prologue-passage" key={scene.id} data-animated={!reducedMotion}
      data-birth-stage={scene.creation ? birthStage : undefined} data-paused={transitionPaused} data-exiting={Boolean(pendingExit)}>
      <h1 ref={heading} tabIndex={-1} className="sr-only">{scene.title}</h1>
      <NarrativePassage key={scene.id} passageId={scene.id} beats={scene.beats || [{ speaker: scene.speaker || "Narration", text: scene.text }]}
        reducedMotion={reducedMotion} textSpeed={textSpeed} paused={transitionPaused || birthStage === "leaving" || Boolean(pendingExit)}
        advanceLabel={scene.creation ? "Choose Your Name" : scene.chapter ? replay ? "Finish Replay" : "Begin Chapter 1" : scene.battle ? "Take Astraea's Place" : "Next Passage"}
        onAdvance={() => scene.creation ? setBirthStage(reducedMotion ? "form" : "leaving") : scene.chapter ? leaveScene("chapter") : onAdvance(scene.id)} />
      {scene.detail && <p className="prologue-detail">{scene.detail}</p>}
    </section>}
    {confirmSkip && <PrologueSkipDialog onCancel={() => setConfirmSkip(false)} onConfirm={() => { setConfirmSkip(false); onSkip(); }} />}
  </main>;
}
