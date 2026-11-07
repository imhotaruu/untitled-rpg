import { useEffect, useId, useRef } from "react";

export default function BattleConfirmModal({ action, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function closeWith(callback) {
    dialogRef.current.close();
    callback();
  }

  return <dialog ref={dialogRef} className="battle-confirm-dialog"
    aria-labelledby={headingId} aria-describedby={descriptionId}
    onCancel={(event) => {
      event.preventDefault();
      closeWith(onCancel);
    }}>
    <h2 id={headingId}>{action.label}?</h2>
    <div id={descriptionId}>
      <p>{action.description}</p>
      <p>Ready to proceed? The battle will open on its own screen.</p>
    </div>
    <div className="battle-confirm-actions">
      <button type="button" autoFocus onClick={() => closeWith(onCancel)}>Not Yet</button>
      <button type="button" className="primary action-button" data-action-kind="battle" onClick={() => closeWith(onConfirm)}>Proceed to Battle</button>
    </div>
  </dialog>;
}
