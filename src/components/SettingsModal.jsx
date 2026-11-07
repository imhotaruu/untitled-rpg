import { useId } from "react";
import CombatOverlay from "./CombatOverlay";
import { DEFAULT_PREFERENCES } from "../utils/preferences";

export default function SettingsModal({ preferences, saved, onChange, onClose }) {
  const id = useId();
  return <CombatOverlay title="Settings" className="settings-modal" onClose={onClose}>
    <div className="settings-fields">
      <div className="settings-field">
        <label htmlFor={`${id}-story-confirm`}>Confirm story actions</label>
        <p id={`${id}-story-confirm-help`}>Ask before performing gold-outlined story actions, including accepting and completing quests.</p>
        <select id={`${id}-story-confirm`} aria-describedby={`${id}-story-confirm-help`} value={String(preferences.confirmStoryActions)}
          onChange={(event) => onChange({ ...preferences, confirmStoryActions: event.target.value === "true" })}>
          <option value="true">On — ask before continuing</option>
          <option value="false">Off — continue immediately</option>
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor={`${id}-pace`}>Combat pacing</label>
        <p id={`${id}-pace-help`}>Controls the pauses between combat messages.</p>
        <select id={`${id}-pace`} aria-describedby={`${id}-pace-help`} value={preferences.combatPace}
          onChange={(event) => onChange({ ...preferences, combatPace: event.target.value })}>
          <option value="slow">Slow — 5–6 seconds per message</option>
          <option value="normal">Normal — 3–4 seconds per message</option>
          <option value="fast">Fast — 2 seconds per message</option>
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor={`${id}-text-speed`}>Dialogue &amp; narration speed</label>
        <p id={`${id}-text-speed-help`}>Controls how quickly letters appear in story and battle dialogue. Click to reveal a line, then click again to advance. Instant shows each line immediately.</p>
        <select id={`${id}-text-speed`} aria-describedby={`${id}-text-speed-help`} value={preferences.textSpeed}
          onChange={(event) => onChange({ ...preferences, textSpeed: event.target.value })}>
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
          <option value="instant">Instant</option>
        </select>
      </div>
      <div className="settings-field">
        <label htmlFor={`${id}-motion`}>Battle motion</label>
        <p id={`${id}-motion-help`}>Reduced motion removes shaking, flashes, and sliding animations.</p>
        <select id={`${id}-motion`} aria-describedby={`${id}-motion-help`} value={preferences.motion}
          onChange={(event) => onChange({ ...preferences, motion: event.target.value })}>
          <option value="reduced">Reduced</option>
          <option value="full">Full</option>
        </select>
      </div>
    </div>
    <footer className="settings-footer">
      <p role="status">{saved
        ? "Changes are saved automatically in this browser, across all save slots."
        : "Changes apply for this session, but could not be saved in this browser."}</p>
      <button type="button" onClick={() => onChange({ ...DEFAULT_PREFERENCES })}>Restore defaults</button>
    </footer>
  </CombatOverlay>;
}
