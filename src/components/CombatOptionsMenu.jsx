import { useEffect, useId, useRef } from "react";

export default function CombatOptionsMenu({ open, onOpen, onClose, disabled, reducedMotion,
  onLog, onOpenModal, replay, onExitReplay, onSkipPrologue }) {
  const dialogRef = useRef(null);
  const dialogId = useId();
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);

  function close() {
    dialogRef.current.close();
    onClose();
  }

  function select(action) {
    close();
    action();
  }

  return <>
    <button type="button" className="combat-options-toggle" aria-label="Game options"
      aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId} disabled={disabled} onClick={onOpen}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m9 3-.6 2.4-1.6.9-2.4-.6-2 3.4 1.8 1.8v2.2l-1.8 1.8 2 3.4 2.4-.6 1.6.9L9 21h4l.6-2.4 1.6-.9 2.4.6 2-3.4-1.8-1.8v-2.2l1.8-1.8-2-3.4-2.4.6-1.6-.9L13 3Z" />
        <circle cx="11" cy="12" r="3" />
      </svg>
    </button>
    <dialog ref={dialogRef} id={dialogId} className="combat-options-dialog" aria-labelledby={titleId}
      data-reduced-motion={reducedMotion}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}>
      <header><h2 id={titleId}>Game options</h2><button autoFocus type="button" onClick={close} aria-label="Close game options">×</button></header>
      <div className="combat-options-actions">
        {onLog && <button type="button" onClick={() => select(onLog)}>Log</button>}
        <button type="button" onClick={() => select(() => onOpenModal("settings"))}>Settings</button>
        {replay ? <button type="button" onClick={() => select(onExitReplay)}>Exit Replay</button> : <>
          <button type="button" onClick={() => select(() => onOpenModal("save"))}>Save</button>
          <button type="button" onClick={() => select(() => onOpenModal("load"))}>Load</button>
          <button type="button" onClick={() => select(() => onOpenModal("reset"))}>Reset</button>
        </>}
        {!replay && onSkipPrologue && <button type="button" onClick={() => select(onSkipPrologue)}>Skip Prologue</button>}
      </div>
    </dialog>
  </>;
}
