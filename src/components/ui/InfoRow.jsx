function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong className={highlight ? "gold-text" : ""}>{value}</strong>
    </div>
  );
}

export default InfoRow;