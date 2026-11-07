import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DialogueHistoryContext } from "./dialogueHistoryContext";
import { getPrependedStoryCount } from "../utils/storyHistory";

export default function DialogueHistoryProvider({ children, storyEntries, storySummaries }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const record = useCallback((entry) => {
    setEntries((current) => current.some((item) => item.id === entry.id) ? current : [...current, entry]);
  }, []);
  const value = useMemo(() => ({ entries, open, setOpen, record }), [entries, open, record]);
  return <DialogueHistoryContext.Provider value={value}>
    <AdventureDialogueRecorder entries={storyEntries} summaries={storySummaries} onRecord={record} />
    {children}
  </DialogueHistoryContext.Provider>;
}

// Adventure story passages are already revealed in full. Keep their sequence,
// including repeated lines, even after the main story panel reaches its cap.
function AdventureDialogueRecorder({ entries, summaries, onRecord }) {
  const previous = useRef([]);
  const sequence = useRef(0);
  const spokenSummaries = useRef(new Set());
  useEffect(() => {
    // Keep the main page's recap, but don't repeat it over the spoken lines in Log.
    for (const text of summaries || []) spokenSummaries.current.add(text);
    if (!entries) return;
    const count = getPrependedStoryCount(previous.current, entries);
    previous.current = entries;
    for (const entry of entries.slice(0, count ?? entries.length).reverse()) {
      const text = typeof entry === "string" ? entry : entry.text;
      const speaker = typeof entry === "string" ? "Narration" : entry.speaker || "Narration";
      if (text && !spokenSummaries.current.has(text)) onRecord({ id: `adventure:${sequence.current++}`, speaker, text });
    }
  }, [entries, summaries, onRecord]);
  return null;
}
