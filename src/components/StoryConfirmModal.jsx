import { useEffect, useId, useRef } from "react";

export default function StoryConfirmModal({ action, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const settled = useRef(false);
  const headingId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function finish(callback) {
    if (settled.current) return;
    settled.current = true;
    dialogRef.current.close();
    callback();
  }

  return <dialog ref={dialogRef} className="battle-confirm-dialog"
    aria-labelledby={headingId} aria-describedby={descriptionId}
    onCancel={(event) => { event.preventDefault(); finish(onCancel); }}>
    <h2 id={headingId}>{action.label}</h2>
    <div id={descriptionId}>
      <p>This will advance the story. Are you sure you want to continue?</p>
      {action.description && <p>{action.description}</p>}
      {action.oneTime && <p>This is a one-time action.</p>}
    </div>
    <div className="battle-confirm-actions">
      <button type="button" autoFocus onClick={() => finish(onCancel)}>Not Yet</button>
      <button type="button" className="primary action-button" data-action-kind="story" onClick={() => finish(onConfirm)}>Continue</button>
    </div>
  </dialog>;
}
