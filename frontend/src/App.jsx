import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser, getJoinedRooms } from './api';
import AppNavbar from './components/AppNavbar';
import PublicProfileModal from './components/PublicProfileModal';
import AppSidebar from './components/AppSidebar';
import ToastHost from './components/ToastHost';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import PlaceholderPage from './pages/PlaceholderPage';
import About from './pages/About';
import Profile from './pages/Profile';
import Register from './pages/Register';
import RoomDetails from './pages/RoomDetails';
import RoomInfo from './pages/RoomInfo';
import Settings from './pages/Settings';
import Updates from './pages/Updates';

function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function LegacyChatRedirect() {
  const { id } = useParams();
  if (!id) return <Navigate to="/home" replace />;
  return <Navigate to={`/room/${id}`} replace />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('accessToken') || '');
  const [profile, setProfile] = useState(null);
  const [apiStatus, setApiStatus] = useState('connected');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [createRoomRequest, setCreateRoomRequest] = useState(0);
  const [refreshRoomsRequest, setRefreshRoomsRequest] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
  const [profileRequest, setProfileRequest] = useState(null);
  const toastTimerRef = useRef(null);

  const isLoggedIn = Boolean(token);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2800);
  };

  useEffect(() => () => {
    window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setProfile(null);
        setJoinedRooms([]);
        return;
      }

      try {
        const data = await getCurrentUser();
        setProfile(data || null);
        setApiStatus('connected');
      } catch (err) {
        setApiStatus('error');
        localStorage.removeItem('accessToken');
        setToken('');
        setProfile(null);
      }
    };

    loadProfile();
  }, [token]);

  useEffect(() => {
    const loadJoinedRooms = async () => {
      if (!token) return;

      try {
        const data = await getJoinedRooms();
        setJoinedRooms(data || []);
      } catch (err) {
        setJoinedRooms([]);
        showToast(err.message || 'Failed to load joined rooms', 'danger');
      }
    };

    loadJoinedRooms();
  }, [token]);

  const handleLoginSuccess = () => {
    setToken(localStorage.getItem('accessToken') || '');
    navigate('/home');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setToken('');
    setProfile(null);
    setJoinedRooms([]);
    showToast('You have been logged out.', 'info');
    navigate('/login');
  };

  const openPublicProfile = (userId, username) => {
    if (!userId) {
      showToast('Profile details unavailable', 'info');
      return;
    }

    setProfileRequest({ userId, username });
  };

  return (
    <>
      <AppNavbar isLoggedIn={isLoggedIn} profile={profile} />

      {isLoggedIn && (
        <AppSidebar
          apiStatus={apiStatus}
          joinedRooms={joinedRooms}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onCreateRoom={() => {
            navigate('/home');
            setCreateRoomRequest((prev) => prev + 1);
          }}
          onRefreshRooms={() => {
            navigate('/home');
            setRefreshRoomsRequest((prev) => prev + 1);
          }}
          selectedCategory={selectedCategory}
          onCategorySelect={(category) => {
            setSelectedCategory(category);
            navigate('/home');
          }}
          onLogout={handleLogout}
        />
      )}

      <main className={isLoggedIn ? `app-main with-sidebar ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}` : 'app-main'}>
        <div key={location.pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<Navigate to={isLoggedIn ? '/home' : '/login'} replace />} />
            <Route path="/login" element={isLoggedIn ? <Navigate to="/home" replace /> : <Login onLoginSuccess={handleLoginSuccess} showToast={showToast} />} />
            <Route path="/register" element={isLoggedIn ? <Navigate to="/home" replace /> : <Register showToast={showToast} />} />
            <Route path="/forgot-password" element={isLoggedIn ? <Navigate to="/home" replace /> : <ForgotPassword showToast={showToast} />} />
            <Route
              path="/home"
              element={(
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Home
                    currentUser={profile}
                    selectedCategory={selectedCategory}
                    createRoomRequest={createRoomRequest}
                    refreshRoomsRequest={refreshRoomsRequest}
                    onApiStatusChange={setApiStatus}
                    showToast={showToast}
                    onJoinedRoomsChange={setJoinedRooms}
                  />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/room/:id"
              element={(
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <RoomDetails
                    currentUser={profile}
                    onApiStatusChange={setApiStatus}
                    showToast={showToast}
                    onOpenPublicProfile={openPublicProfile}
                  />
                </ProtectedRoute>
              )}
            />
            <Route path="/chat/:id" element={<ProtectedRoute isLoggedIn={isLoggedIn}><LegacyChatRedirect /></ProtectedRoute>} />
            <Route
              path="/room/:id/info"
              element={(
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <RoomInfo
                    currentUser={profile}
                    onApiStatusChange={setApiStatus}
                    showToast={showToast}
                    onOpenPublicProfile={openPublicProfile}
                  />
                </ProtectedRoute>
              )}
            />
            <Route path="/profile" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Profile currentUser={profile} setCurrentUser={setProfile} showToast={showToast} onJoinedRoomsChange={setJoinedRooms} /></ProtectedRoute>} />
            <Route path="/updates" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Updates /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Settings onLogout={handleLogout} showToast={showToast} /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute isLoggedIn={isLoggedIn}><PlaceholderPage title="Help" description="Help and FAQ content is coming soon." /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute isLoggedIn={isLoggedIn}><About showToast={showToast} /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={isLoggedIn ? '/home' : '/login'} replace />} />
          </Routes>
        </div>
      </main>
      <PublicProfileModal profileRequest={profileRequest} onClose={() => setProfileRequest(null)} showToast={showToast} />
      <ToastHost toast={toast} />
    </>
  );
}

export default App;
