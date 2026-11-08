import { useLayoutEffect, useRef, useState } from "react";
import { chapterOne } from "../data/prologue";
import { getStoryTimeline } from "../engine/storyTimelineSystem";
import "./StoryPage.css";

const MOMENT_WIDTH = 240;
const TRACK_HEIGHT = 360;

export default function StoryPage({ gameState, onReplay, reducedMotion = false }) {
  const moments = getStoryTimeline(gameState);
  const [selectedId, setSelectedId] = useState("chapter_one_opening");
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef(null);
  const buttons = useRef(new Map());
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const selected = moments.find((moment) => moment.id === selectedId) || moments[0];
  const selectedIndex = moments.indexOf(selected);
  const groups = [
    { id: "prologue", label: "Prologue" },
    { id: chapterOne.id, label: chapterOne.label },
  ].map((group) => ({ ...group, moments: moments.filter((moment) => moment.chapter === group.id) }))
    .filter((group) => group.moments.length);
  const width = groups.reduce((sum, group) => sum + group.moments.length * MOMENT_WIDTH + 48, 0);

  function centerMoment(id) {
    const viewport = viewportRef.current;
    const button = buttons.current.get(id);
    if (!viewport || !button) return;
    const box = button.getBoundingClientRect();
    const frame = viewport.getBoundingClientRect();
    viewport.scrollLeft += box.left + box.width / 2 - frame.left - viewport.clientWidth / 2;
    viewport.scrollTop += box.top + box.height / 2 - frame.top - viewport.clientHeight / 2;
  }

  useLayoutEffect(() => {
    centerMoment(selected?.id);
  }, [selected?.id, zoom]);

  function focusMoment(id) {
    const button = buttons.current.get(id);
    if (!button) return;
    setSelectedId(id);
    button.focus({ preventScroll: true });
    centerMoment(id);
  }

  function handleMomentKey(event, index) {
    const destination = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: moments.length - 1 }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    focusMoment(moments[Math.max(0, Math.min(moments.length - 1, destination))].id);
  }

  function startDrag(event) {
    // Touch keeps native scrolling and browser pinch zoom. Mouse/pen dragging
    // begins only after a threshold, so a normal node click still selects it.
    if (!event.isPrimary || event.button !== 0 || event.pointerType === "touch") return;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
      left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop, dragging: false };
  }

  function moveDrag(event) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.dragging && Math.hypot(dx, dy) < 6) return;
    if (!drag.dragging) {
      drag.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
    }
    event.preventDefault();
    suppressClick.current = true;
    event.currentTarget.scrollLeft = drag.left - dx;
    event.currentTarget.scrollTop = drag.top - dy;
  }

  function endDrag(event) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function resetView() {
    setZoom(1);
    focusMoment("chapter_one_opening");
  }

  const heading = <header className="story-heading">
      <div><span className="story-eyebrow">The journey so far</span><h1 id="story-title">Story</h1>
        <p>Small beginnings. Moments that stay with you.</p></div>
    </header>;

  return <section className="character-page-panel story-timeline-page" aria-labelledby="story-title" data-reduced-motion={reducedMotion}>
    {!selected ? <>{heading}<p className="story-empty">Your journey's timeline begins in Chapter 1.</p></> : <div className="story-workspace">
      <div className="story-map">
        {heading}
        <div className="story-map-toolbar">
          <span id="story-map-help">Drag to explore · Select a moment<span className="sr-only">. When a moment is focused, use Left or Right to browse, Home for the first moment, or End for the last.</span></span>
          <div className="story-zoom" role="group" aria-label="Timeline view">
            <button type="button" aria-label="Zoom out timeline" disabled={zoom <= 0.75} onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}>−</button>
            <output aria-label="Timeline zoom" aria-live="polite">{Math.round(zoom * 100)}%</output>
            <button type="button" aria-label="Zoom in timeline" disabled={zoom >= 1.5} onClick={() => setZoom((value) => Math.min(1.5, value + 0.25))}>+</button>
            <button type="button" className="story-reset-view" onClick={resetView}>Reset view</button>
          </div>
        </div>
        <div ref={viewportRef} className="story-map-viewport" role="region" aria-label="Story timeline" aria-describedby="story-map-help"
          tabIndex={0} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
          onLostPointerCapture={endDrag} onPointerLeave={(event) => { if (!gesture.current?.dragging) endDrag(event); }}
          onClickCapture={(event) => {
            if (suppressClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
          }}>
          <div className="story-map-size" style={{ width: width * zoom, height: TRACK_HEIGHT * zoom }}>
            <div className="story-map-track" style={{ width, height: TRACK_HEIGHT, transform: `scale(${zoom})` }}>
              {groups.map((group) => <section key={group.id} className="story-era" aria-label={group.label}
                data-current={group.id === chapterOne.id} style={{ width: group.moments.length * MOMENT_WIDTH + 48 }}>
                <div className="story-era-heading"><span>{group.label}</span>{group.id === chapterOne.id && <span className="story-era-current">Current chapter</span>}</div>
                <ol className="story-moments">
                  {group.moments.map((moment, groupIndex) => {
                    const index = moments.indexOf(moment);
                    return <li key={moment.id} className="story-moment" data-side={groupIndex % 2 ? "below" : "above"}
                      data-selected={selected.id === moment.id} style={{ width: MOMENT_WIDTH }}>
                      <span className="story-moment-pin" aria-hidden="true">{moment.symbol}</span>
                      <button type="button" ref={(element) => { if (element) buttons.current.set(moment.id, element); else buttons.current.delete(moment.id); }}
                        aria-pressed={selected.id === moment.id} aria-controls="story-moment-detail"
                        onFocus={() => { if (!gesture.current) setSelectedId(moment.id); }} onClick={() => setSelectedId(moment.id)}
                        onKeyDown={(event) => handleMomentKey(event, index)}>
                        <span>{moment.label}</span><strong>{moment.title}</strong>
                      </button>
                    </li>;
                  })}
                </ol>
              </section>)}
            </div>
          </div>
        </div>
        <footer className="story-map-footer"><span>Revealed moments · Story order</span>
          <div role="group" aria-label="Browse story moments">
            <button type="button" aria-label="Previous moment" disabled={selectedIndex === 0} onClick={() => focusMoment(moments[selectedIndex - 1].id)}>← Previous</button>
            <button type="button" aria-label="Next moment" disabled={selectedIndex === moments.length - 1} onClick={() => focusMoment(moments[selectedIndex + 1].id)}>Next →</button>
          </div>
        </footer>
      </div>

      <aside id="story-moment-detail" className="story-detail" aria-label="Selected story moment" aria-live="polite" aria-atomic="true">
        <div key={selected.id} className="story-detail-content">
          <span className="story-eyebrow">{selected.chapter === "prologue" ? "Prologue" : chapterOne.label}</span>
          <div className="story-detail-emblem" aria-hidden="true">{selected.symbol}</div>
          <span className="story-detail-label">{selected.label}</span>
          <h2>{selected.title}</h2><p className="story-detail-place">{selected.place}</p>
          <p className="story-detail-prose">{selected.text}</p>
          {selected.replay && <div className="story-replay"><button type="button" onClick={onReplay}>Replay Prologue</button>
            <p>Includes the combat tutorial and birth scene. Your adventure progress stays as it is.</p></div>}
        </div>
      </aside>
    </div>}
  </section>;
}
