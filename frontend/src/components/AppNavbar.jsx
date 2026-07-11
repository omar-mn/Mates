import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../api';

const getFallbackAvatar = (name) => {
  const safeName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff`;
};

function AppNavbar({ isLoggedIn, profile }) {
  const username = profile?.username || 'User';
  const fallbackAvatar = getFallbackAvatar(username);
  const avatar = resolveMediaUrl(profile?.profileImage, fallbackAvatar);

  return (
    <nav className="navbar border-bottom app-navbar sticky-top">
      <div className="container-fluid px-3 px-lg-4 py-2">
        <div className="d-flex align-items-center gap-2">
          {isLoggedIn && (
            <button
              className="btn sidebar-toggle d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#appSidebarOffcanvas"
              aria-controls="appSidebarOffcanvas"
            >
              <i className="bi bi-list" />
            </button>
          )}
          <Link className="navbar-brand fw-bold mb-0" to={isLoggedIn ? '/home' : '/login'}>
            Mates
          </Link>
        </div>

        {isLoggedIn && (
          <div className="d-flex align-items-center gap-2">
            <img src={avatar} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackAvatar; }} alt="avatar" width="36" height="36" className="rounded-circle border" />
            <span className="fw-semibold small">{username}</span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default AppNavbar;
