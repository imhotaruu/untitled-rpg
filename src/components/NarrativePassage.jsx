import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { DialogueHistoryContext } from "./dialogueHistoryContext";
import { advanceStoryCursor, getStoryCharacterDelay, initialStoryCursor, splitStoryCharacters } from "../utils/storyTyping";

export default function NarrativePassage({ beats, onAdvance, advanceLabel = "Continue", reducedMotion = false, textSpeed = "normal", paused = false, variant = "prologue", passageId }) {
  const history = useContext(DialogueHistoryContext);
  const instanceId = useId();
  const historyId = passageId || instanceId;
  paused = paused || Boolean(history?.open);
  const [cursor, setCursor] = useState(initialStoryCursor);
  const finished = useRef(false);
  const beat = beats[cursor.line] || { speaker: "Narration", text: "" };
  const characterSpeaking = !["Narration", "Narrator", "Tutorial Message"].includes(beat.speaker);
  const characters = useMemo(() => splitStoryCharacters(beat.text), [beat.text]);
  const instant = textSpeed === "instant";
  const shown = instant ? characters.length : cursor.shown;
  const typing = shown < characters.length;
  const actionLabel = typing ? "Reveal current line" : cursor.line + 1 < beats.length ? "Next line" : advanceLabel;
  const record = history?.record;
  const recordLine = useCallback(() => {
    if (beat.text) record?.({ id: `${historyId}:${cursor.line}`, speaker: beat.speaker, text: beat.text });
  }, [historyId, beat.speaker, beat.text, cursor.line, record]);
  useEffect(() => { if (!typing) recordLine(); }, [typing, recordLine]);

  useEffect(() => {
    if (paused || cursor.finished || cursor.shown >= characters.length) return;
    const timer = setTimeout(() => {
      setCursor((current) => current.line !== cursor.line || current.finished ? current
        : { ...current, shown: instant ? characters.length : Math.min(current.shown + 1, characters.length) });
    }, instant ? 0 : getStoryCharacterDelay(characters[Math.max(0, cursor.shown - 1)], textSpeed));
    return () => clearTimeout(timer);
  }, [characters, cursor.line, cursor.shown, cursor.finished, paused, instant, textSpeed]);

  const advance = useCallback(() => {
    if (paused || finished.current) return;
    recordLine();
    const next = advanceStoryCursor({ ...cursor, shown }, characters.length, beats.length);
    setCursor(next);
    if (next.finished) {
      finished.current = true;
      onAdvance?.();
    }
  }, [paused, cursor, shown, characters.length, beats.length, onAdvance, recordLine]);

  useEffect(() => {
    function handleKey(event) {
      if (!["Enter", " "].includes(event.key) || event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
      // Forms, toolbars, dialogs and the reader's own native button keep their
      // normal keyboard behavior. In particular, naming the baby cannot skip text.
      if (event.target.closest?.("button, input, select, textarea, a, summary, dialog, [role='dialog'], [contenteditable='true']")) return;
      event.preventDefault();
      if (!event.repeat) advance();
    }
    if (!paused && !cursor.finished) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [advance, paused, cursor.finished]);

  return <div className={variant === "battle" ? "narrative-reader battle-dialogue-reader" : "narrative-reader"}
    data-character={characterSpeaking} data-speaker={beat.speaker} data-reduced-motion={reducedMotion}>
    <button type="button" className="narrative-screen-button" disabled={paused || cursor.finished}
      aria-label={actionLabel}
      onKeyDown={(event) => { if (event.repeat && ["Enter", " "].includes(event.key)) event.preventDefault(); }}
      onClick={advance}>
      {variant === "battle" && characterSpeaking && <span className="dialogue-portrait" aria-hidden="true">
        <span className="dialogue-portrait-halo" />
        <span className="dialogue-portrait-head" />
        <span className="dialogue-portrait-body" />
        <span className="dialogue-portrait-initial">{beat.speaker.slice(0, 1)}</span>
      </span>}
      {characterSpeaking && <span className="prologue-speaker narrative-speaker" aria-hidden="true">{beat.speaker}</span>}
      <span className="narrative-line" aria-hidden="true">
        <span className="narrative-line-reserve"><StoryText text={beat.text} /></span>
        <span className="narrative-line-visible"><StoryText text={characters.slice(0, shown).join("")} /></span>
      </span>
      <span className="narrative-continue" data-ready={!typing && !cursor.finished} aria-hidden="true">
        <span className="narrative-arrow">▾</span>
      </span>
    </button>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{beat.speaker}: {beat.text}</span>
  </div>;
}

function StoryText({ text }) {
  return text.split(/\b(Order|Chaos)\b/u).map((part, index) => part === "Order" || part === "Chaos"
    ? <span className={`prologue-word-${part.toLowerCase()}`} key={index}>{part}</span> : part);
}
