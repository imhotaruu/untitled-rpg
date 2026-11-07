import { encounters } from "../data/encounters";
import CombatPanel from "./CombatPanel";
import useCombatPlayback from "./useCombatPlayback";
import { useContext, useState } from "react";
import TutorialReading from "./TutorialReading";
import PrologueSkipDialog from "./PrologueSkipDialog";
import DialogueHistoryButton from "./DialogueHistoryButton";
import { DialogueHistoryContext } from "./dialogueHistoryContext";
import CombatOptionsMenu from "./CombatOptionsMenu";

export default function CombatScreen({ combat, areaLabel, onMove, onDismiss, onOpenModal, magicUnlocked, inventory, combatPace = "normal", textSpeed = "normal", reducedMotion = false, replay = false, onExitReplay, onSkipPrologue, paused = false }) {
  const playback = useCombatPlayback(combat, onMove, combatPace);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const history = useContext(DialogueHistoryContext);
  const reading = combat.tutorial?.reading;
  return <>
    <CombatOptionsMenu open={optionsOpen} onOpen={() => setOptionsOpen(true)} onClose={() => setOptionsOpen(false)}
      disabled={playback.busy || paused || confirmSkip || Boolean(history?.open)} reducedMotion={reducedMotion}
      onLog={history ? () => history.setOpen(true) : null} onOpenModal={onOpenModal}
      replay={replay} onExitReplay={onExitReplay} onSkipPrologue={onSkipPrologue ? () => setConfirmSkip(true) : null} />
    <DialogueHistoryButton hideButton />
    <main className={reading ? "combat-screen combat-with-dialogue" : "combat-screen"} aria-label={reading ? "Tutorial story" : "Combat"}
      onClick={(event) => {
        if (!reading || paused || confirmSkip || optionsOpen || event.target.closest("button, input, select, textarea, a, details, dialog, [role='dialog']")) return;
        event.currentTarget.querySelector(".narrative-screen-button")?.click();
      }}>
      <h1 className="sr-only">{encounters[combat.encounterId].label} · {areaLabel}</h1>
      <div className="combat-underlay" inert={Boolean(reading)} aria-hidden={reading ? true : undefined}>
        <CombatPanel combat={playback.combat} onMove={playback.chooseMove} onDismiss={onDismiss} dialogueActive={Boolean(reading)}
        busy={playback.busy} frame={playback.frame} reducedMotion={reducedMotion}
        magicUnlocked={magicUnlocked} inventory={inventory} />
      </div>
      {reading && <TutorialReading phaseId={reading} reducedMotion={reducedMotion} textSpeed={textSpeed} paused={paused || confirmSkip || optionsOpen} onContinue={() => playback.chooseMove("continue_tutorial")} />}
    </main>
    {confirmSkip && <PrologueSkipDialog onCancel={() => setConfirmSkip(false)} onConfirm={() => { setConfirmSkip(false); onSkipPrologue(); }} />}
  </>;
}
