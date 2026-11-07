function Panel({ title, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <h2>{title}</h2>
      </div>

      {children}
    </section>
  );
}

export default Panel;