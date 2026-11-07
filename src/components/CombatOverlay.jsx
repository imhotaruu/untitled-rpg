import { useEffect, useId, useRef } from "react";

export default function CombatOverlay({ title, onClose, children, className = "" }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function close() {
    dialogRef.current.close();
    onClose();
  }

  return <dialog ref={dialogRef} className={`battle-overlay ${className}`} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); close(); }}>
    <header className="battle-overlay-header">
      <h2 id={titleId}>{title}</h2>
      <button type="button" autoFocus onClick={close}>Close</button>
    </header>
    <div className="battle-overlay-body">{children}</div>
  </dialog>;
}
