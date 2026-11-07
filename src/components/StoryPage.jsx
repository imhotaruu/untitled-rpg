import { chapterOne } from "../data/prologue";

export default function StoryPage({ onReplay }) {
  return <section className="character-page-panel activity-page">
    <header><h1>Story</h1><p>{chapterOne.label} — {chapterOne.title}</p></header>
    <p>Your story begins among the people of the village. Training, exploration, and the people you help shape these first days.</p>
    <article className="activity-card"><h2>Prologue</h2>
      <p>When the Stars Faltered — stand with Astraea, Goddess of Stars, and the Divine Authorities in their struggle against Chaos.</p>
      <p>Replay includes the combat and magic tutorial, followed by the birth scene. Your adventure progress stays as it is.</p>
      <button type="button" onClick={onReplay}>Replay Prologue</button>
    </article>
  </section>;
}
