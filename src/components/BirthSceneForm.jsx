import { useState } from "react";
import { characterGenders } from "../engine/prologueSystem";

export default function BirthSceneForm({ draft, onChange, onComplete, replay, disabled = false }) {
  const [error, setError] = useState("");
  return <form className="birth-scene-form" aria-busy={disabled} onSubmit={(event) => {
    event.preventDefault();
    if (disabled) return;
    if (!draft.name.trim()) { setError("Enter a name for your character."); return; }
    setError("");
    onComplete(draft);
  }}>
    <h1>What will they call you?</h1>
    <label htmlFor="birth-name">Name</label>
    <input id="birth-name" autoFocus autoComplete="off" maxLength={32} required value={draft.name} disabled={disabled}
      aria-describedby={error ? "birth-error" : undefined}
      onChange={(event) => onChange({ ...draft, name: event.target.value })} />
    <label htmlFor="birth-gender">Gender</label>
    <select id="birth-gender" value={draft.gender} disabled={disabled} onChange={(event) => onChange({ ...draft, gender: event.target.value })}>
      {characterGenders.map((gender) => <option key={gender}>{gender}</option>)}
    </select>
    {error && <p id="birth-error" role="alert">{error}</p>}
    {replay && <p className="prologue-detail">This is a replay. These choices will not change your character.</p>}
    <button className="primary" type="submit" disabled={disabled}>Begin Your Life</button>
  </form>;
}
