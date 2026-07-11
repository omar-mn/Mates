function PlaceholderPage({ title, description }) {
  return (
    <div className="container-fluid py-4 px-3 px-lg-4 detail-page-shell">
      <div className="card border-0 shadow-sm rounded-4 p-4 soft-enter-panel about-placeholder-card">
        <div className="placeholder-page-label">Placeholder</div>
        <h2 className="mb-3">{title}</h2>
        <p className="mb-0 text-secondary">{description}</p>
      </div>
    </div>
  );
}

export default PlaceholderPage;
