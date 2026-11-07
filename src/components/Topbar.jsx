import { useEffect, useState } from "react";
import DialogueHistoryButton from "./DialogueHistoryButton";

function Topbar({
  activePage,
  currentAreaLabel,
  player,
  onChangePage,
  onOpenModal,
  availablePages = [],
  revealingPages = [],
  onReveal,
  reducedMotion = false,
}) {
  const isMainPage = activePage === "main";
  return (
    <header className={isMainPage ? "topbar" : "page-toolbar"}>
      {isMainPage ? <nav className="nav-tabs" aria-label="Main navigation">
        {availablePages.map((page) => <NavigationButton key={page.id} page={page}
          active={activePage === page.id} isNew={revealingPages.includes(page.id)}
          reducedMotion={reducedMotion} onReveal={onReveal} onChangePage={onChangePage} />)}
      </nav> : <nav aria-label="Return navigation">
        <button className="back-to-main" type="button" onClick={() => onChangePage("main")}>
          <span aria-hidden="true">←</span> Back to Main
        </button>
      </nav>}

      <div className="topbar-right">
        {isMainPage && <div className="status-strip" aria-label="Current status">
          <span>Area: {currentAreaLabel}</span>
          <span>{player.day}</span>
          <span>Path: {player.path}</span>
        </div>}

        <div className="top-actions">
          <DialogueHistoryButton />
          <button type="button" aria-haspopup="dialog" onClick={() => onOpenModal("settings")}>
            Settings
          </button>
          <button type="button" onClick={() => onOpenModal("save")}>
            Save
          </button>

          <button type="button" onClick={() => onOpenModal("load")}>
            Load
          </button>

          <button type="button" onClick={() => onOpenModal("reset")}>
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

function NavigationButton({ page, active, isNew, reducedMotion, onReveal, onChangePage }) {
  const [animate, setAnimate] = useState(isNew && !reducedMotion);
  useEffect(() => { if (isNew) onReveal?.(page.id); }, [isNew, onReveal, page.id]);
  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setAnimate(false), 650);
    return () => clearTimeout(timer);
  }, [animate]);
  return <button type="button" className={active ? "nav-btn active" : "nav-btn"}
    aria-current={active ? "page" : undefined} data-unlocking={animate && !reducedMotion}
    onAnimationEnd={() => setAnimate(false)} onClick={() => onChangePage(page.id)}>
    {page.label}
  </button>;
}
