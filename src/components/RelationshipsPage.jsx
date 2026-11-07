import { useEffect, useId, useRef, useState } from "react";
import { getRelationshipChart } from "../engine/relationshipSystem";

function getPositions(people) {
  // Keep both parents together and Rowan on the other side of the player/Garron link.
  // This avoids crossing bonds and overlapping midpoint buttons in the four-person chart.
  const order = ["player", "elira", "garron", "rowan"];
  const arranged = [...people].sort((a, b) =>
    (order.includes(a.id) ? order.indexOf(a.id) : order.length) -
    (order.includes(b.id) ? order.indexOf(b.id) : order.length));
  return Object.fromEntries(arranged.map((person, index) => {
    if (people.length === 1) return [person.id, [50, 50]];
    if (people.length === 2) return [person.id, [index ? 78 : 22, 50]];
    const angle = -Math.PI / 2 + index * 2 * Math.PI / people.length;
    return [person.id, [50 + 34 * Math.cos(angle), 50 + 32 * Math.sin(angle)]];
  }));
}

export default function RelationshipsPage({ gameState }) {
  const [selectedId, setSelectedId] = useState("player");
  const [selectedBondId, setSelectedBondId] = useState(null);
  const chartRef = useRef(null);
  const arrowId = useId();
  const [chartSize, setChartSize] = useState({ width: 0, height: 0, portraitSize: 64 });

  useEffect(() => {
    const chart = chartRef.current;
    const observer = new ResizeObserver(() => {
      setChartSize({ width: chart.clientWidth, height: chart.clientHeight,
        portraitSize: parseFloat(getComputedStyle(chart).getPropertyValue("--relationship-portrait-size")) || 64 });
    });
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);
  const { people, connections } = getRelationshipChart(gameState);
  const selected = people.find((person) => person.id === selectedId) || people[0];
  const related = connections.filter((connection) => connection.from === selected.id || connection.to === selected.id);
  const nameOf = (id) => people.find((person) => person.id === id)?.name;
  const positions = getPositions(people);
  const activeBond = related.find((connection) => connection.id === selectedBondId) || related[0];

  function selectPerson(id) {
    setSelectedId(id);
    setSelectedBondId(null);
  }

  function selectBond(connection) {
    if (connection.from !== selected.id && connection.to !== selected.id) setSelectedId(connection.from);
    setSelectedBondId(connection.id);
  }

  return <section className="character-page-panel relationships-page" aria-labelledby="relationships-title">
    <header className="relationships-heading">
      <div><h1 id="relationships-title">Relationships</h1><p>The people who become part of your story.</p></div>
      <span>{people.length - 1} {people.length === 2 ? "person" : "people"} known</span>
    </header>
    <div className="relationships-content">
      <section className="relationship-details" id="relationship-details" aria-labelledby="relationship-person-title">
        <header className="relationship-profile">
          <span className="relationship-portrait profile-portrait" aria-hidden="true">{selected.name.slice(0, 1)}</span>
          <h2 id="relationship-person-title">{selected.name}</h2>
          <span className="relationship-eyebrow">Character profile</span>
        </header>
        <dl className="relationship-profile-facts">
          <div><dt>Role</dt><dd>{selected.role}</dd></div>
          {selected.location && <div><dt>Location</dt><dd>{selected.location}</dd></div>}
          {selected.id === "player" && <div><dt>Level</dt><dd>{gameState.player.level}</dd></div>}
        </dl>
        <p>{selected.description}</p>
        <h3>Connections</h3>
        {related.length ? <>
          <div className="relationship-bond-picker" role="group" aria-label={`Connections with ${selected.name}`}>
            {related.map((connection) => {
              const otherId = connection.from === selected.id ? connection.to : connection.from;
              return <button key={connection.id} type="button" aria-pressed={activeBond?.id === connection.id}
                aria-controls="relationship-moments" onClick={() => selectBond(connection)}>
                <strong>{nameOf(otherId)}</strong><span>{connection.relationship ? `${connection.relationship} · ` : ""}{connection.label}</span>
              </button>;
            })}
          </div>
          <section className="relationship-bond" id="relationship-moments" aria-labelledby="relationship-moments-title">
            <h3 id="relationship-moments-title">{activeBond.moments.length ? "Shared moments" : activeBond.from === "player" ? "Your bond" : "Their story"}</h3>
            <p className="relationship-bond-names">{nameOf(activeBond.from)} <span aria-label="and">↔</span> {nameOf(activeBond.to)}</p>
            {activeBond.relationship && <p>{activeBond.relationship}</p>}
            {activeBond.background && <p>{activeBond.background}</p>}
            <ol>{activeBond.moments.map((moment, index) => <li key={index}>
              <strong>{moment.label}</strong><p>{moment.text}</p>
            </li>)}</ol>
          </section>
        </> : <p className="relationship-help">No shared moments recorded yet.</p>}
      </section>
      <section className="relationship-map" aria-labelledby="village-chart-title">
        <header><span className="relationship-eyebrow">Affinity chart</span><h2 id="village-chart-title">Village connections</h2></header>
        <p className="relationship-help">Select a portrait to trace their bonds, or a diamond to read a shared history.</p>
        <div ref={chartRef} className="relationship-chart" role="group" aria-label="People you know">
          <svg className="relationship-lines" aria-hidden="true">
            <defs>
              {["muted", "selected", "active"].map((tone) => <marker key={tone} id={`${arrowId}-${tone}`}
                viewBox="0 0 12 10" markerWidth="12" markerHeight="10" refX="0" refY="5"
                orient="auto-start-reverse" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 12 5 L 0 10 Z" className={`relationship-arrow ${tone}`} />
              </marker>)}
            </defs>
            {connections.map((connection) => {
              // Work in pixels so diagonal endpoints and arrowheads stay circular-edge aligned at any aspect ratio.
              const [fromX, fromY] = positions[connection.from];
              const [toX, toY] = positions[connection.to];
              const x1 = fromX * chartSize.width / 100;
              const y1 = fromY * chartSize.height / 100;
              const x2 = toX * chartSize.width / 100;
              const y2 = toY * chartSize.height / 100;
              const distance = Math.hypot(x2 - x1, y2 - y1);
              // Stop the shaft at the arrow's base; its 12px tip extends toward the portrait.
              const inset = chartSize.portraitSize / 2 + 10 + 12;
              if (distance <= inset * 2) return null;
              const dx = (x2 - x1) / distance * inset;
              const dy = (y2 - y1) / distance * inset;
              const tone = connection.id === activeBond?.id ? "active" : connection.from === selected.id || connection.to === selected.id ? "selected" : "muted";
              return <line key={connection.id} x1={x1 + dx} y1={y1 + dy} x2={x2 - dx} y2={y2 - dy}
                markerStart={`url(#${arrowId}-${tone})`} markerEnd={`url(#${arrowId}-${tone})`}
                className={`is-${tone}`} />;
            })}
          </svg>
          {connections.map((connection) => {
            const [x1, y1] = positions[connection.from];
            const [x2, y2] = positions[connection.to];
            const label = `${nameOf(connection.from)} and ${nameOf(connection.to)}: ${connection.relationship ? `${connection.relationship}. ` : ""}${connection.label}. ${connection.moments.length} shared ${connection.moments.length === 1 ? "moment" : "moments"}.`;
            return <button type="button" key={connection.id} className="relationship-marker"
              style={{ left: `${(x1 + x2) / 2}%`, top: `${(y1 + y2) / 2}%` }}
              aria-label={label} title={label} aria-pressed={activeBond?.id === connection.id}
              aria-controls="relationship-details" onClick={() => selectBond(connection)}
              data-related={connection.from === selected.id || connection.to === selected.id}>
              <span aria-hidden="true">◇</span><span className="relationship-marker-count" aria-hidden="true">{connection.moments.length}</span>
            </button>;
          })}
          {people.map((person) => {
            const [x, y] = positions[person.id];
            return <button key={person.id} type="button" className="relationship-person"
              style={{ left: `${x}%`, top: `${y}%` }} aria-pressed={selected.id === person.id}
              aria-controls="relationship-details" onClick={() => selectPerson(person.id)}>
              <span className="relationship-portrait" aria-hidden="true">{person.name.slice(0, 1)}</span>
              <strong>{person.name}</strong>
            </button>;
          })}
        </div>
        {connections.length ? <div className="relationship-legend">
          <span><i aria-hidden="true" /> Selected person's connections</span>
          <span><b aria-hidden="true">↔</b> Mutual connection</span>
          <span><b aria-hidden="true">◇</b> Number of shared moments</span>
        </div> : <p className="relationship-empty">Your story here is just beginning. Connections will appear as you get to know people.</p>}
      </section>
    </div>
  </section>;
}
