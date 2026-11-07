import { useLayoutEffect, useRef } from "react";
import { getPartyVitalLosses } from "../utils/partyVitalFeedback";

export default function usePartyVitalFeedback(cardRef, member, active, finished, reducedMotion) {
  const { hp, maxHp, stamina, maxStamina, mp, maxMp } = member;
  const previous = useRef({ hp, maxHp, stamina, maxStamina, mp, maxMp });
  useLayoutEffect(() => {
    const current = { hp, maxHp, stamina, maxStamina, mp, maxMp };
    const losses = getPartyVitalLosses(previous.current, current);
    previous.current = current;
    const card = cardRef.current;
    if (!card || !losses.length) return;
    const meters = losses.map((loss) => ({ ...loss, element: card.querySelector(`[data-stat-type="${loss.type}"]`) }))
      .filter((loss) => loss.element);
    if (!meters.length) return;
    const reveal = !active && !finished;
    if (reveal) {
      const bottom = card.getBoundingClientRect().bottom;
      // Lift only as far as the lowest affected meter, keeping unaffected lower
      // stats tucked away. All calculations stay within this member's card.
      const recess = Math.max(0, Math.min(...meters.map(({ element }) => bottom - element.getBoundingClientRect().bottom - 4)));
      card.style.setProperty("--party-card-feedback-recess", `${recess}px`);
      card.dataset.revealingVitals = "true";
    }
    const animations = [];
    if (!reducedMotion) {
      for (const { element, from, to } of meters) {
        const fill = element.querySelector(".stat-fill");
        // Hold the old width while the hidden meter rises, then drain it.
        if (fill) animations.push(fill.animate([{ width: `${from}%` }, { width: `${to}%` }],
          { delay: reveal ? 260 : 0, duration: 650, easing: "ease-out", fill: "backwards" }));
        animations.push(element.animate([{ filter: "brightness(1.6)" }, { filter: "brightness(1)" }],
          { delay: reveal ? 260 : 0, duration: 650, easing: "ease-out" }));
      }
    }
    const hide = () => {
      delete card.dataset.revealingVitals;
      card.style.removeProperty("--party-card-feedback-recess");
    };
    const timer = reveal ? setTimeout(hide, 1500) : null;
    return () => {
      clearTimeout(timer);
      animations.forEach((animation) => animation.cancel());
      hide();
    };
  }, [cardRef, hp, maxHp, stamina, maxStamina, mp, maxMp, active, finished, reducedMotion]);
}
