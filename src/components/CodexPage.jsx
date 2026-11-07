import { useEffect, useId, useState } from "react";
import { getJournalEntries } from "../engine/journalSystem";

export default function CodexPage({ gameState, onRead }) {
  const entries = getJournalEntries(gameState);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => entries.find((entry) => !entry.read)?.id || null);
  const [newOnOpen] = useState(() => new Set(entries.filter((entry) => !entry.read).map((entry) => entry.id)));
  const detailId = useId();
  const searchId = useId();
  const search = query.trim().toLocaleLowerCase();
  const visible = entries.filter((entry) => (category === "all" || entry.category === category)
    && [entry.title, entry.text, entry.person, entry.location, entry.source].filter(Boolean).join(" ").toLocaleLowerCase().includes(search));
  const selected = visible.find((entry) => entry.id === selectedId) || visible[0];
  const selectedIndex = visible.findIndex((entry) => entry.id === selected?.id);
  const selectedEntryId = selected?.id;
  const selectedIsRead = selected?.read;
  const unread = entries.filter((entry) => !entry.read).length;
  const categories = [{ id: "all", label: "All notes" }, { id: "resources", label: "Resources" }, { id: "conversations", label: "Conversations" }];

  useEffect(() => {
    if (selectedEntryId && !selectedIsRead) onRead?.(selectedEntryId);
  }, [selectedEntryId, selectedIsRead, onRead]);

  return <section className="character-page-panel codex-page" aria-labelledby="codex-title">
    <header className="activity-heading"><h1 id="codex-title">Codex</h1>
      <p>Things found along the way. Words worth remembering.</p></header>
    <div className="codex-content">
      <section className="codex-index-page" aria-label="Journal contents">
        <h2 className="codex-contents-title">Contents</h2>
        <div className="codex-tools">
      <div className="codex-filters" role="group" aria-label="Journal categories">
        {categories.map((item) => {
          const hasUnread = entries.some((entry) => !entry.read && (item.id === "all" || entry.category === item.id));
          return <button type="button" key={item.id} aria-pressed={category === item.id}
            aria-label={`${item.label}${hasUnread ? ", unread notes" : ""}`} onClick={() => setCategory(item.id)}>
            {item.label}{hasUnread && <span className="codex-unread-marker" aria-hidden="true">!</span>}
          </button>;
        })}
      </div>
      <div className="codex-search"><label htmlFor={searchId}>Search your notes</label>
        <input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="A resource, person, or place…" /></div>
        </div>
      <nav className="codex-list" aria-label="Journal entries">
        <p className="codex-count" role="status">{visible.length} {visible.length === 1 ? "note" : "notes"}{unread > 0 ? ` · ${unread} unread` : ""}</p>
        {visible.map((entry) => <button type="button" key={entry.id} aria-pressed={selected?.id === entry.id} aria-controls={detailId}
          onClick={() => setSelectedId(entry.id)}>
          <span className="codex-index-label"><span className="activity-eyebrow">{entry.category === "resources" ? "Resource" : entry.person}</span>
            {!entry.read && <span className="codex-new-label">New</span>}</span>
          <strong>{entry.title}</strong><span>{entry.location || "Earlier journey"}</span>
        </button>)}
      </nav>
      <span className="codex-page-flourish" aria-hidden="true">◆</span>
      </section>
      <section className="codex-reading-page" aria-label="Selected journal note">
      <article id={detailId} className="codex-entry" aria-live="polite" aria-atomic="true" key={selected?.id || "empty"}>
        {selected ? <>
          <div className="codex-index-label"><span className="activity-eyebrow">{selected.category === "resources" ? "First obtained" : "A conversation remembered"}</span>
            {(newOnOpen.has(selected.id) || !selected.read) && <span className="codex-new-label">Newly recorded</span>}</div>
          <h2>{selected.title}</h2>
          <p className="codex-prose">{selected.text}</p>
          <dl className="codex-origin">
            {selected.person && <div><dt>From</dt><dd>{selected.person}</dd></div>}
            <div><dt>{selected.category === "resources" ? "First obtained at" : "Spoken at"}</dt><dd>{selected.location || "Location not recorded"}</dd></div>
            <div><dt>When</dt><dd>{selected.day || "Date not recorded"}</dd></div>
            {selected.source && selected.category === "resources" && <div><dt>How</dt><dd>{selected.source}</dd></div>}
          </dl>
          {selected.sourceType === "memory" && <p className="codex-memory">Remembered from an earlier part of your journey. The original place and date were not recorded.</p>}
          {selected.category === "conversations" && <p className="codex-footnote">A note of what was said at the time.</p>}
        </> : <div className="codex-empty"><h2>{entries.length ? "No matching notes" : "The first page is still blank"}</h2>
          <p>{entries.length ? "Try another category or search for a different word." : "Discoveries and useful words from the people you meet will find a place here."}</p></div>}
      </article>
      <nav className="codex-pagination" aria-label="Browse journal notes">
        <button type="button" disabled={selectedIndex <= 0} onClick={() => setSelectedId(visible[selectedIndex - 1].id)} aria-controls={detailId}>
          <span aria-hidden="true">←</span> Previous
        </button>
        <span>{selected ? `Note ${selectedIndex + 1} of ${visible.length}` : "—"}</span>
        <button type="button" disabled={selectedIndex < 0 || selectedIndex >= visible.length - 1}
          onClick={() => setSelectedId(visible[selectedIndex + 1].id)} aria-controls={detailId}>
          Next <span aria-hidden="true">→</span>
        </button>
      </nav>
      </section>
    </div>
  </section>;
}
