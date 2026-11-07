import { useEffect, useId, useRef, useState } from "react";

export default function BattleInfoBadge({ symbol, label, description, kind = "intent" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function dismissOnEscape(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);

  return <div ref={rootRef} className="battle-info-badge" data-kind={kind}
    onPointerEnter={() => setOpen(true)}
    onPointerLeave={(event) => {
      if (event.pointerType !== "touch" && !event.currentTarget.contains(document.activeElement)) setOpen(false);
    }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button type="button" aria-label={label} aria-describedby={tooltipId} aria-expanded={open}
      onFocus={() => setOpen(true)} onClick={() => setOpen(true)}>
      <span aria-hidden="true">{symbol}</span>
    </button>
    <div id={tooltipId} className="battle-info-tooltip" role="tooltip" hidden={!open}>
      <strong>{label}</strong>
      <p>{description}</p>
    </div>
  </div>;
}
