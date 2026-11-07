import { useEffect, useRef, useState } from "react";

export default function SealTransitionDialog({ onContinue, reducedMotion = false }) {
  const dialogRef = useRef(null);
  const requested = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onContinue, reducedMotion ? 0 : 320);
    return () => clearTimeout(timer);
  }, [leaving, onContinue, reducedMotion]);

  function proceed() {
    if (requested.current) return;
    requested.current = true;
    setLeaving(true);
  }

  return <dialog ref={dialogRef} className="seal-transition" aria-labelledby="seal-transition-title"
    aria-describedby="seal-transition-description" aria-busy={leaving}
    data-leaving={leaving} data-reduced-motion={reducedMotion}
    onCancel={(event) => event.preventDefault()}>
    <span className="seal-transition-star" aria-hidden="true">✦</span>
    <h2 id="seal-transition-title">The way is open.</h2>
    <p id="seal-transition-description">Your companions need one final push.</p>
    <button type="button" autoFocus disabled={leaving} onClick={proceed}>Reach the Seal</button>
  </dialog>;
}
