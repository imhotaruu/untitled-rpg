import { useEffect, useRef } from "react";
import { tutorialPassages } from "../data/prologueScript";
import { divinePhases } from "../data/divineTutorial";
import NarrativePassage from "./NarrativePassage";

export default function TutorialReading({ phaseId, onContinue, reducedMotion = false, textSpeed = "normal", paused = false }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [phaseId]);
  const phase = divinePhases.find((entry) => entry.id === phaseId);
  return <section className="battle-dialogue-panel" aria-label="Battle dialogue">
    <h1 ref={heading} tabIndex={-1} className="sr-only">{phase?.label}</h1>
    <NarrativePassage key={phaseId} beats={tutorialPassages[phaseId] || []} reducedMotion={reducedMotion} textSpeed={textSpeed} paused={paused}
      variant="battle" passageId={`battle:${phaseId}`}
      advanceLabel={phaseId === "finisher" ? "Return to the Seal" : "Continue Training"} onAdvance={onContinue} />
  </section>;
}
