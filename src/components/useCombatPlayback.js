import { useEffect, useRef, useState } from "react";
import { resolveCombatTurn } from "../engine/combatSystem";
import { getCombatFrameDuration } from "../utils/combatPacing";

export default function useCombatPlayback(combat, onMove, combatPace = "normal") {
  const [playback, setPlayback] = useState(null);
  const pendingRef = useRef(null);
  const busy = Boolean(playback && playback.source === combat);
  const frame = busy ? playback.frames[playback.index] : null;

  useEffect(() => {
    if (!playback || playback.source !== combat) {
      pendingRef.current = null;
      return;
    }
    const timer = setTimeout(() => {
      if (pendingRef.current !== playback.token) return;
      if (playback.index + 1 < playback.frames.length) {
        setPlayback({ ...playback, index: playback.index + 1 });
      } else {
        pendingRef.current = null;
        setPlayback(null);
        onMove(playback.moveId);
      }
    }, getCombatFrameDuration(frame.kind, playback.pace));
    return () => clearTimeout(timer);
  }, [playback, combat, frame, onMove]);

  function chooseMove(moveId) {
    if (pendingRef.current) return;
    const result = resolveCombatTurn(combat, moveId);
    if (result.combat === combat) return;
    if (moveId === "retreat" || result.frames.length === 0) {
      onMove(moveId);
      return;
    }
    const token = {};
    pendingRef.current = token;
    // Keep one pace for the entire exchange, independent of future preferences.
    setPlayback({ source: combat, moveId, frames: result.frames, index: 0, token, pace: combatPace });
  }

  return {
    busy,
    frame: frame ? { ...frame, id: `${combat.round}-${playback.index}` } : null,
    combat: frame ? { ...combat, player: frame.player, enemy: frame.enemy } : combat,
    chooseMove,
  };
}
