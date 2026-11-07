function InfoGroup({ title, children }) {
  return (
    <div className="info-group">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export default InfoGroup;