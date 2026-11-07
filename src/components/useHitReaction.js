import { useEffect, useRef } from "react";

// Presentation only: compare real vitals, never infer a hit from narrated text.
export default function useHitReaction(hp, cue = null, reducedMotion = false) {
  const elementRef = useRef(null);
  const previousHp = useRef(hp);
  const cueId = cue?.id;
  const cueKind = cue?.kind;
  const cueAction = cue?.action;
  useEffect(() => {
    const damaged = hp < previousHp.current;
    previousHp.current = hp;
    const usingMove = cueKind === "use";
    if ((!damaged && !usingMove) || reducedMotion) return;
    const attack = ["attack", "heavy_strike", "enemy_attack"].includes(cueAction);
    const animation = elementRef.current?.animate(damaged ? [
      { transform: "translateX(0)", filter: "brightness(1)" },
      { transform: "translateX(-5px)", filter: "brightness(1.45)" },
      { transform: "translateX(5px)", filter: "brightness(1.15)" },
      { transform: "translateX(-3px)", filter: "brightness(1)" },
      { transform: "translateX(0)", filter: "brightness(1)" },
    ] : attack ? [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-8px) scale(1.04)" },
      { transform: "translateY(0) scale(1)" },
    ] : [
      { filter: "brightness(1)" },
      { filter: "brightness(1.4)" },
      { filter: "brightness(1)" },
    ], { duration: damaged ? 260 : 360, easing: "ease-out" });
    return () => animation?.cancel();
  }, [hp, cueId, cueKind, cueAction, reducedMotion]);
  return elementRef;
}
