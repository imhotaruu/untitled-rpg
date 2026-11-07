import { formatStatValue } from "../../utils/formatters";

function StatMeter({ label, value, max, type }) {
  const percent =
    max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const displayValue = formatStatValue(value, type);
  const displayMax = formatStatValue(max, "max");

  return (
    <div className="stat-meter">
      <div className="stat-meter-top">
        <span>{label}</span>
        <strong>
          {displayValue}/{displayMax}
        </strong>
      </div>

      <div className="stat-track">
        <div
          className={`stat-fill stat-fill-${type}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default StatMeter;