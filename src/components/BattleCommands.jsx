import { useEffect, useRef, useState } from "react";
import { getCombatMoves, encounters } from "../data/encounters";
import { items } from "../data/items";
import { divinePhases, getDivinePhase, isDivineMoveAvailable } from "../data/divineTutorial";

const categories = {
  root: { label: "Commands", description: "Choose a category or a defensive move." },
  attack: { label: "Attack", description: "Choose a physical attack. Physical attacks use stamina." },
  magic: { label: "Magic", description: "Cast learned spells using mana." },
  items: { label: "Items", description: "View your consumables. Items cannot be used in this practice bout." },
};

export default function BattleCommands({ combat, magicUnlocked, inventory, onMove, onPreview, detailsId, busy = false }) {
  const tutorial = encounters[combat.encounterId].tutorial;
  const combatMoves = getCombatMoves(combat);
  const phase = tutorial ? getDivinePhase(combat) : null;
  const magicAvailable = tutorial ? phase?.id !== "strike" : magicUnlocked;
  const phaseIndex = divinePhases.indexOf(phase);
  const unlockedMoves = tutorial ? combatMoves.filter((move) => divinePhases.findIndex((entry) => entry.moveId === move.id) <= phaseIndex) : combatMoves;
  const [menu, setMenu] = useState("root");
  const menuRef = useRef(null);
  const previousMenu = useRef(menu);
  const previousBusy = useRef(busy);

  useEffect(() => {
    const previous = previousMenu.current;
    const wasBusy = previousBusy.current;
    previousMenu.current = menu;
    previousBusy.current = busy;
    if (busy || (previous === menu && !wasBusy)) return;
    const target = menu === "root"
      ? menuRef.current?.querySelector(`[data-command-id="${wasBusy ? "attack" : previous}"]:not(:disabled)`)
      : menuRef.current?.querySelector("[data-command-id]:not(:disabled)");
    (target || menuRef.current?.querySelector(".battle-menu-back"))?.focus({ preventScroll: true });
  }, [menu, busy]);

  function openMenu(id) {
    if (busy) return;
    setMenu(id);
    onPreview(categories[id]);
  }

  function navigateCommands(event) {
    if (event.repeat && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      return;
    }
    if (busy) return;
    if (event.key === "Escape" && menu !== "root") {
      event.preventDefault();
      openMenu("root");
      return;
    }
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll("button:not(:disabled)"));
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
  }

  function command({ id, label, description, kind = "normal", meta, disabled = false, onClick, cost }) {
    return <button key={id} type="button" className="action-button battle-command"
      data-command-id={id} data-action-kind={kind} disabled={disabled || busy}
      aria-controls={detailsId} aria-describedby={detailsId}
      onPointerEnter={() => onPreview({ label, description, cost })}
      onFocus={() => onPreview({ label, description, cost })} onClick={onClick}>
      <span className="command-pointer" aria-hidden="true">›</span>
      <span>{label}</span><small>{meta}</small>
    </button>;
  }

  const consumables = (inventory?.items || []).flatMap((entry) => {
    const item = items.find((candidate) => candidate.id === (entry.itemId || entry.id));
    const quantity = entry.quantity ?? 1;
    return item?.type === "consumable" && quantity > 0 ? [{ item, quantity }] : [];
  });

  return <div ref={menuRef} onKeyDown={navigateCommands}>
    <div className="battle-menu-heading">
      <h2>{categories[menu].label}</h2>
      {menu !== "root" && <button type="button" className="battle-menu-back" onClick={() => openMenu("root")}>Back</button>}
    </div>
    <div className="battle-command-list" onPointerLeave={() => onPreview(categories[menu])}>
      {menu === "root" && <>
        {command({ id: "attack", ...categories.attack, kind: "battle", meta: "ST", onClick: () => openMenu("attack") })}
        {command({ id: "magic", label: magicAvailable ? "Magic" : "???",
          description: magicAvailable ? categories.magic.description : "Not yet discovered.",
          kind: magicAvailable ? "magic" : "normal", meta: magicAvailable ? "MP" : "Locked",
          disabled: !magicAvailable, onClick: () => openMenu("magic") })}
        {!tutorial && command({ id: "items", ...categories.items, meta: "Bag", onClick: () => openMenu("items") })}
      </>}
      {(menu === "attack" ? unlockedMoves.filter((move) => move.category === "physical")
        : menu === "magic" ? unlockedMoves.filter((move) => move.category === "magic")
        : menu === "root" ? unlockedMoves.filter((move) => !move.category) : []).map((move) => command({
        ...move, label: move.id === "attack" && !tutorial ? "Strike" : move.label,
        kind: move.category === "magic" ? "magic" : move.id === "recover" ? "rest" : "battle",
        meta: move.manaCost ? `${move.manaCost} MP` : move.cost ? `${move.cost} ST` : "Free",
        disabled: combat.player.stamina < move.cost || (move.manaCost && combat.player.mp < move.manaCost) || (tutorial && !isDivineMoveAvailable(combat, move.id)),
        onClick: () => {
          if (busy) return;
          setMenu("root");
          onPreview(categories.root);
          onMove(move.id);
        },
      }))}
    </div>
    {menu === "magic" && !tutorial && <p className="battle-menu-note">No spells learned yet.</p>}
    {menu === "items" && <div className="battle-item-list">
      <p className="battle-menu-note">Consumables are kept for your adventure. They cannot be used during this spar.</p>
      {consumables.length ? consumables.map(({ item, quantity }) => <article key={item.id} tabIndex={0}
        onPointerEnter={() => onPreview(item)} onFocus={() => onPreview(item)}>
        <strong>{item.label}</strong><span>×{quantity}</span>
      </article>) : <p className="battle-menu-note">No consumables in your inventory.</p>}
    </div>}
    {!tutorial && <button className="battle-end-spar" type="button" disabled={busy} onClick={() => onMove("retreat")}>End Spar</button>}
  </div>;
}
