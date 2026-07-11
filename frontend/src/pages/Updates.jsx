const roadmapPhases = [
  {
    title: 'Phase 1 — MVP',
    status: 'Completed',
    statusClass: 'is-completed',
    description: 'The first phase focused on building the core version of the app and getting the main room/chat system working.',
    items: [],
  },
  {
    title: 'Phase 2 — Deployment & Infrastructure',
    status: 'Next',
    statusClass: 'is-next',
    description: 'This phase is focused on learning deployment, infrastructure, and the DevOps side of the project.',
    items: [
      'Proper backend deployment',
      'Real database hosting',
      'Better uptime and reliability',
      'Improved security and environment setup',
      'Cleaner production-ready infrastructure',
    ],
  },
];

const phaseThreeGroups = [
  {
    title: 'Profile & Identity',
    items: [
      'User profile images (banner and profile)',
      'Verify login email',
      'Reset password',
    ],
  },
  {
    title: 'Rooms & Permissions',
    items: [
      'Room banners / room images',
      'Hidden rooms',
      'Role management for room members',
      'Room invites',
    ],
  },
  {
    title: 'Messaging & Social',
    items: [
      'Online members in rooms',
      'Message read-by status',
      'Emojis, stickers, and message reactions',
      'Reply to message',
      'One-to-one chat',
      'Friends system',
      'More ideas over time',
    ],
  },
];

function Updates() {
  return (
    <div className="container-fluid py-4 px-3 px-lg-4 detail-page-shell updates-page">
      <section className="updates-hero-card soft-enter-panel mb-4">
        <div className="placeholder-page-label">Roadmap</div>
        <h1 className="mb-3">Project Roadmap</h1>
        <p className="text-secondary mb-0 updates-hero-copy">
          Mates is being built in phases. The MVP is already done, the next step is deployment and infrastructure, and after that the app will move into a bigger feature-expansion phase.
        </p>
      </section>

      <section className="row g-3 g-xl-4 mb-4" aria-label="Project phases">
        {roadmapPhases.map((phase) => (
          <div className="col-12 col-xl-6" key={phase.title}>
            <article className="updates-phase-card h-100 soft-enter-panel">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
                <div>
                  <p className="updates-phase-kicker mb-2">Project phase</p>
                  <h2 className="h4 mb-0">{phase.title}</h2>
                </div>
                <span className={`updates-status-badge ${phase.statusClass}`}>{phase.status}</span>
              </div>

              <p className="text-secondary mb-0">{phase.description}</p>

              {phase.items.length > 0 && (
                <ul className="updates-checklist list-unstyled mb-0 mt-4">
                  {phase.items.map((item) => (
                    <li key={item}>
                      <i className="bi bi-check2-circle" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        ))}
      </section>

      <section className="updates-phase-card soft-enter-panel" aria-labelledby="phase-3-heading">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
          <div>
            <p className="updates-phase-kicker mb-2">Longer-term roadmap</p>
            <h2 id="phase-3-heading" className="h4 mb-0">Phase 3 — Feature Expansion</h2>
          </div>
          <span className="updates-status-badge is-planned">Planned</span>
        </div>

        <p className="text-secondary mb-4">
          This phase is where the app itself gets expanded with more features.
        </p>

        <div className="row g-3 g-lg-4">
          {phaseThreeGroups.map((group) => (
            <div className="col-12 col-lg-4" key={group.title}>
              <div className="updates-roadmap-group h-100">
                <h3 className="h6 text-uppercase updates-roadmap-heading">{group.title}</h3>
                <ol className="updates-roadmap-list mb-0">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-secondary small mt-4 mb-0">More ideas may be added over time.</p>
    </div>
  );
}

export default Updates;
