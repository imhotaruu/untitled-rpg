export default function LogScrollControl({ canJump, hasUnread = false, onJump }) {
  const label = canJump ? "Jump to latest" : "Newest first";
  const accessibleLabel = hasUnread ? "New story available. Jump to latest" : label;

  return (
    <button type="button" className="log-scroll-control" disabled={!canJump} onClick={onJump}
      data-unread={hasUnread} aria-label={accessibleLabel} title={accessibleLabel}>
      <span className="log-scroll-size" aria-hidden="true">Jump to latest</span>
      <span>{label}</span>
    </button>
  );
}
