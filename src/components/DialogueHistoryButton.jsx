import { useContext, useEffect, useRef } from "react";
import { DialogueHistoryContext } from "./dialogueHistoryContext";
import CombatOverlay from "./CombatOverlay";

export default function DialogueHistoryButton({ disabled = false, hideButton = false }) {
  const history = useContext(DialogueHistoryContext);
  const end = useRef(null);
  useEffect(() => {
    if (history?.open) end.current?.scrollIntoView({ block: "end" });
  }, [history?.open]);
  if (!history) return null;
  return <>
    {!hideButton && <button type="button" disabled={disabled} aria-haspopup="dialog" onClick={() => history.setOpen(true)}>Log</button>}
    {history.open && <CombatOverlay title="Log" className="dialogue-history" onClose={() => history.setOpen(false)}>
      <p className="muted">Dialogue and narration · Oldest first</p>
      {history.entries.length ? <ol className="dialogue-history-entries">
        {history.entries.map((entry) => <li key={entry.id}><h3>{entry.speaker}</h3><p>{entry.text}</p></li>)}
      </ol> : <p>No dialogue has been read yet.</p>}
      <div ref={end} />
    </CombatOverlay>}
  </>;
}
