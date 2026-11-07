import { useEffect } from "react";

export default function ItemFeedbackPopup({ feedback, onDismiss, position = "bottom-center" }) {
  useEffect(() => {
    if (!feedback) return;
    const timeoutId = setTimeout(() => onDismiss(feedback), feedback.duration ?? 4500);
    return () => clearTimeout(timeoutId);
  }, [feedback, onDismiss]);

  return (
    <div
      className="item-feedback-region"
      data-position={position}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {feedback && (
        <div className="item-feedback-popup" data-tone={feedback.tone} key={feedback.id}>
          <h3>
            <span aria-hidden="true">{feedback.tone === "success" ? "✓" : "ⓘ"}</span>
            {feedback.title}
          </h3>
          <p className="item-feedback-name">{feedback.itemLabel}</p>
          <ul>
            {feedback.messages.map((message, index) => <li key={index}>{message}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
