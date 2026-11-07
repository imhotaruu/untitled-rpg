import { useEffect, useRef } from "react";

export default function PrologueSkipDialog({ onCancel, onConfirm }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="battle-confirm-dialog" aria-labelledby="skip-prologue-title"
    onCancel={(event) => { event.preventDefault(); onCancel(); }}>
    <h2 id="skip-prologue-title">Skip the prologue?</h2>
    <p>Continue to your birth and character creation. You can replay the prologue from Story later.</p>
    <div className="top-actions"><button autoFocus type="button" onClick={onCancel}>Keep Playing</button>
      <button type="button" onClick={onConfirm}>Skip to Birth Scene</button></div>
  </dialog>;
}
