import { useEffect, useRef } from "react";
import DialogueHistoryButton from "./DialogueHistoryButton";
import NarrativePassage from "./NarrativePassage";

export default function ConversationScreen({ conversation, areaLabel, onFinish, onOpenModal, textSpeed, reducedMotion, paused = false }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [conversation.token]);
  return <>
    <header className="combat-screen-header conversation-header">
      <div><p>{areaLabel}</p><h1 ref={heading} tabIndex={-1}>{conversation.person.name} <span>· {conversation.person.role}</span></h1></div>
      <div className="top-actions" role="group" aria-label="Conversation options">
        <DialogueHistoryButton disabled={paused} />
        <button type="button" aria-haspopup="dialog" onClick={() => onOpenModal("settings")}>Settings</button>
        <button type="button" onClick={() => onOpenModal("save")}>Save</button>
        <button type="button" onClick={() => onOpenModal("load")}>Load</button>
      </div>
    </header>
    <main className="conversation-screen" data-person={conversation.person.id} aria-label={`Conversation with ${conversation.person.name}`}
      onClick={(event) => {
        if (paused || event.target.closest("button, input, select, textarea, a, details, dialog, [role='dialog']")) return;
        event.currentTarget.querySelector(".narrative-screen-button")?.click();
      }}>
      <div className="conversation-atmosphere" aria-hidden="true"><span /></div>
      <section className="battle-dialogue-panel" aria-label="Dialogue">
        <NarrativePassage key={conversation.token} passageId={`conversation:${conversation.token}`}
          beats={conversation.beats} variant="battle" textSpeed={textSpeed} reducedMotion={reducedMotion} paused={paused}
          advanceLabel="Return to the village" onAdvance={() => onFinish(conversation.token)} />
      </section>
    </main>
  </>;
}
