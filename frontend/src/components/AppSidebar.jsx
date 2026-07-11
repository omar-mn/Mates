import { NavLink } from 'react-router-dom';

const categories = ['study', 'games', 'programing', 'life issues', 'other'];

const navigationItems = [
  { to: '/home', icon: 'bi-house', label: 'Home' },
  { to: '/profile', icon: 'bi-person', label: 'Profile' },
  { to: '/updates', icon: 'bi-megaphone', label: 'Updates' },
  { to: '/about', icon: 'bi-info-circle', label: 'About' },
  { to: '/settings', icon: 'bi-gear', label: 'Settings' },
];

function SidebarNav({ collapsed }) {
  return (
    <nav className="nav flex-column gap-1">
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={collapsed ? item.label : ''}
          className={({ isActive }) => `sidebar-link ${collapsed ? 'sidebar-link-icon-only' : ''} ${isActive ? 'active' : ''}`}
        >
          <i className={`bi ${item.icon}`} />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function JoinedRoomsList({ joinedRooms, collapsed }) {
  if (collapsed) return null;

  return (
    <div className="sidebar-section">
      <h6 className="sidebar-heading">Joined Rooms</h6>
      <div className="joined-rooms-panel">
        {joinedRooms.length ? joinedRooms.map((item, index) => {
          const room = item.room || item;
          const membersCount = room?.membersCount ?? 0;
          const privacyLabel = room?.private ? 'Private' : 'Public';
          return (
            <NavLink
              key={room?.id || item.id || index}
              to={`/room/${room?.id}`}
              className={({ isActive }) => `joined-room-item ${isActive ? 'active' : ''}`}
            >
              <div className="joined-room-main">
                <span className="joined-room-name text-truncate">{room?.name || 'Room'}</span>
                <span className={`joined-room-privacy-badge ${room?.private ? 'is-private' : 'is-public'}`}>
                  <i className={`bi ${room?.private ? 'bi-lock-fill' : 'bi-globe2'}`} />
                  {privacyLabel}
                </span>
              </div>
              <div className="joined-room-meta">
                <span>{membersCount} member{membersCount === 1 ? '' : 's'}</span>
                <span aria-hidden="true">•</span>
                <span>{privacyLabel}</span>
              </div>
            </NavLink>
          );
        }) : <div className="small text-secondary px-2 py-2">No joined rooms yet.</div>}
      </div>
    </div>
  );
}

function SidebarContent({
  onCreateRoom,
  onRefreshRooms,
  apiStatus,
  selectedCategory,
  onCategorySelect,
  onLogout,
  collapsed,
  joinedRooms,
  onToggleCollapse,
}) {
  return (
    <>
      <div className="sidebar-top-row">
        {!collapsed && <div className="sidebar-heading mb-0">Workspace</div>}
        <button className="btn btn-sm sidebar-collapse-button" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <i className={`bi ${collapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} />
        </button>
      </div>

      <div className="sidebar-section">
        {!collapsed && <h6 className="sidebar-heading">Navigation</h6>}
        <SidebarNav collapsed={collapsed} />
      </div>

      {!collapsed && (
        <>
          <div className="sidebar-section">
            <h6 className="sidebar-heading">Quick Actions</h6>
            <div className="d-grid gap-2">
              <button className="btn btn-primary btn-sm" onClick={onCreateRoom}><i className="bi bi-plus-circle" /> Create Room</button>
              <button className="btn btn-outline-secondary btn-sm" onClick={onRefreshRooms}><i className="bi bi-arrow-clockwise" /> Refresh Rooms</button>
            </div>
          </div>

          <div className="sidebar-section">
            <h6 className="sidebar-heading">Categories</h6>
            <div className="d-flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => onCategorySelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <JoinedRoomsList joinedRooms={joinedRooms} collapsed={collapsed} />

      <div className="sidebar-section mt-auto">
        {!collapsed && <h6 className="sidebar-heading">Account</h6>}
        <button className={`sidebar-link sidebar-button ${collapsed ? 'sidebar-link-icon-only' : ''}`} onClick={onLogout} title="Logout">
          <i className="bi bi-box-arrow-right" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-footer small">
          <div>Version: v0.1</div>
          <span className={`badge ${apiStatus === 'error' ? 'text-bg-danger' : 'text-bg-success'}`}>
            API: {apiStatus === 'error' ? 'Error' : 'Connected'}
          </span>
        </div>
      )}
    </>
  );
}

function AppSidebar(props) {
  return (
    <>
      <aside className={`app-sidebar d-none d-lg-flex ${props.collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <div className="app-sidebar-inner">
          <SidebarContent {...props} />
        </div>
      </aside>

      <div className="offcanvas offcanvas-start app-sidebar-offcanvas" tabIndex="-1" id="appSidebarOffcanvas">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Mates Menu</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <div className="offcanvas-body d-flex flex-column gap-3">
          <SidebarContent {...props} collapsed={false} />
        </div>
      </div>
    </>
  );
}

export default AppSidebar;
