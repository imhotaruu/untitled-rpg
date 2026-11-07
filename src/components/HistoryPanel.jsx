import { useEffect, useId, useRef, useState } from "react";
import LogScrollControl from "./ui/LogScrollControl";

export default function HistoryPanel({ actionLog, resetKey }) {
  const headingId = useId();
  const contentRef = useRef(null);
  const [isAwayFromTop, setIsAwayFromTop] = useState(false);

  useEffect(() => {
    contentRef.current.scrollTop = 0;
  }, [resetKey]);

  function jumpToLatest() {
    contentRef.current.scrollTop = 0;
    contentRef.current.focus({ preventScroll: true });
    setIsAwayFromTop(false);
  }

  return (
    <section className="panel history-panel" aria-labelledby={headingId}>
      <header className="history-header">
        <h2 id={headingId}>Action Log</h2>
        <LogScrollControl canJump={isAwayFromTop} onJump={jumpToLatest} />
      </header>
      <div ref={contentRef} className="history-content" role="region"
        aria-labelledby={headingId} tabIndex={0}
        onScroll={(event) => setIsAwayFromTop(event.currentTarget.scrollTop > 8)}>
        <ul className="log-list">
          {actionLog.map((entry, index) => {
            const message = typeof entry === "string" ? entry : entry?.message || "";
            const type = typeof entry === "string" ? "default" : entry?.type || "default";
            return <li key={`${message}-${index}`} className={`log-entry log-entry-${type}`}>{message}</li>;
          })}
        </ul>
        {actionLog.length === 0 && <p className="empty-note">No actions recorded yet.</p>}
      </div>
    </section>
  );
}
