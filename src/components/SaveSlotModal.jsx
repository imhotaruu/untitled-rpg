import { areas } from "../data/areas";
import { getAreaLabel } from "../engine/selectors";
import { formatSlotDate } from "../utils/formatters";

function SaveSlotModal({
  mode,
  slots,
  onClose,
  onSave,
  onLoad,
  onDeleteSlot,
  onResetCurrentGame,
  onDeleteAllSaves,
}) {
  const title = {
    save: "Save Game",
    load: "Load Game",
    reset: "Reset / Delete Saves",
  }[mode];

  return (
    <div className="modal-backdrop">
      <section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {mode === "reset" && (
          <div className="modal-danger-zone">
            <button type="button" onClick={onResetCurrentGame}>
              Reset Current Game
            </button>

            <button type="button" onClick={onDeleteAllSaves}>
              Delete All Save Slots
            </button>
          </div>
        )}

        <div className="save-slot-list">
          {slots.map((slot) => (
            <SaveSlotCard
              key={slot.slotId}
              mode={mode}
              slot={slot}
              onSave={onSave}
              onLoad={onLoad}
              onDeleteSlot={onDeleteSlot}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function SaveSlotCard({ mode, slot, onSave, onLoad, onDeleteSlot }) {
  const areaLabel = slot.areaLabel || (slot.areaId ? getAreaLabel(areas, slot.areaId) : null);

  return (
    <div className="save-slot-card">
      <div className="save-slot-info">
        <strong>Slot {slot.slotId}</strong>

        {slot.hasSave ? (
          <>
            <span>
              {slot.playerName || "Player"} · Level {slot.level ?? 1}
            </span>
            <span>{areaLabel || "Unknown Area"}</span>
            {slot.storyStage && <span>{slot.storyStage}</span>}
            <span>{slot.day || "Unknown Day"}</span>
            <span>{formatSlotDate(slot.savedAt)}</span>
          </>
        ) : (
          <span>Empty Slot</span>
        )}
      </div>

      <div className="save-slot-actions">
        {mode === "save" && (
          <button type="button" onClick={() => onSave(slot.slotId)}>
            {slot.hasSave ? "Overwrite" : "Save"}
          </button>
        )}

        {mode === "load" && (
          <button
            type="button"
            disabled={!slot.hasSave}
            onClick={() => onLoad(slot.slotId)}
          >
            Load
          </button>
        )}

        {mode === "reset" && (
          <button
            type="button"
            disabled={!slot.hasSave}
            onClick={() => onDeleteSlot(slot.slotId)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default SaveSlotModal;
