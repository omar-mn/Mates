import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  cancelJoinRequest,
  getCurrentUser,
  getJoinedRooms,
  getMyPendingRequests,
  getRooms,
  getDefaultBanner,
  resolveMediaUrl,
  updateCurrentUser,
} from '../api';
import bannerimage from './matesbanner.png'

const getFallbackAvatar = (name) => {
  const safeName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff`;
};

function Profile({ currentUser, setCurrentUser, showToast, onJoinedRoomsChange }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(currentUser || null);
  const [myRooms, setMyRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelingRequestId, setCancelingRequestId] = useState(null);
  const [requestToCancel, setRequestToCancel] = useState(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
  });

  const fullName = useMemo(() => {
    const fromApi = profile?.full_name && profile.full_name !== 'None None' ? profile.full_name : '';
    const local = `${form.first_name || ''} ${form.last_name || ''}`.trim();
    return fromApi || local || profile?.username || 'Profile';
  }, [form.first_name, form.last_name, profile]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const userData = await getCurrentUser();
      setProfile(userData);
      setCurrentUser?.(userData);
      setForm((prev) => ({
        ...prev,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        bio: userData.bio || '',
      }));

      const [rooms, joinedRoomsData, pendingRequestsData] = await Promise.all([
        getRooms(),
        getJoinedRooms(),
        getMyPendingRequests(),
      ]);

      setMyRooms((rooms || []).filter((room) => room.owner?.username === userData.username));
      setJoinedRooms(joinedRoomsData || []);
      setPendingRequests(pendingRequestsData || []);
      onJoinedRoomsChange?.(joinedRoomsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      showToast?.(err.message || 'Failed to load profile', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        bio: form.bio,
      };

      const updated = await updateCurrentUser(payload);
      setProfile(updated);
      setCurrentUser?.(updated);
      showToast?.('Profile updated successfully.', 'success');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      showToast?.(err.message || 'Failed to update profile', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;

    setCancelingRequestId(requestToCancel.id);
    try {
      await cancelJoinRequest(requestToCancel.id);
      setPendingRequests((prev) => prev.filter((request) => request.id !== requestToCancel.id));
      window.bootstrap.Modal.getOrCreateInstance(document.getElementById('cancelJoinRequestModal')).hide();
      showToast?.('Request canceled', 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to cancel request', 'danger');
    } finally {
      setCancelingRequestId(null);
      setRequestToCancel(null);
    }
  };

  if (loading) {
    return <div className="container py-5 text-center"><div className="spinner-border" /></div>;
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4 profile-page-shell">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 soft-enter-panel">
        <img
          src={bannerimage}
          onError={(e) => { e.currentTarget.src = getDefaultBanner(profile?.username); }}
          alt="profile banner"
          style={{ height: '200px', objectFit: 'cover' }}
        />
        <div className="p-4 d-flex flex-wrap align-items-center gap-3">
          <img
            src={resolveMediaUrl(profile?.profileImage, getFallbackAvatar(profile?.username))}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackAvatar(profile?.username); }}
            alt="profile"
            width="88"
            height="88"
            className="rounded-circle border"
          />
          <div>
            <h4 className="mb-1">{fullName}</h4>
            <div className="text-secondary">@{profile?.username || 'user'}</div>
            <div className="text-secondary">{profile?.email || 'No email available'}</div>
            <p className="mb-0 mt-2 text-secondary">{profile?.bio || form.bio || 'No bio added yet.'}</p>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <form className="card border-0 shadow-sm rounded-4 p-4 h-100" onSubmit={handleSubmit}>
            <h5 className="mb-3">Edit profile</h5>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">First name</label>
                <input className="form-control" value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Last name</label>
                <input className="form-control" value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label">Bio</label>
                <textarea className="form-control" rows="3" value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} />
              </div>
            </div>

            <div className="mt-4">
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="mb-3">My Rooms</h5>
            {myRooms.length ? (
              <ul className="list-group list-group-flush">
                {myRooms.map((room) => (
                  <li key={room.id} className="list-group-item px-0">
                    <div className="fw-semibold">{room.name}</div>
                    <small className="text-secondary">{room.category || 'General'}</small>
                  </li>
                ))}
              </ul>
            ) : <div className="alert alert-info mb-0">No rooms created yet.</div>}
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
              <h5 className="mb-0">Joined Rooms</h5>
              <span className="text-secondary small">{joinedRooms.length} room{joinedRooms.length === 1 ? '' : 's'}</span>
            </div>
            <div className="d-grid gap-3">
              {joinedRooms.length ? joinedRooms.map((item) => (
                <button
                  key={item.room?.id || item.id}
                  className="joined-room-card text-start"
                  onClick={() => navigate(`/room/${item.room?.id}`)}
                >
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <div>
                      <div className="fw-semibold fs-5">{item.room?.name || 'Room'}</div>
                      <div className="d-flex gap-2 flex-wrap mt-2">
                        <span className="room-category-pill">{item.room?.category || 'General'}</span>
                        <span className={`room-privacy-badge ${item.room?.private ? 'is-private' : 'is-public'}`}>
                          <i className={`bi ${item.room?.private ? 'bi-lock-fill' : 'bi-globe2'}`} />
                          {item.room?.private ? 'Private' : 'Public'}
                        </span>
                        <span className="request-state-badge state-neutral text-capitalize">{item.role || 'member'}</span>
                      </div>
                    </div>
                    <span className="text-secondary small">{item.room?.membersCount ?? 0} members</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mt-3 text-secondary small">
                    <img
                      src={resolveMediaUrl(item.room?.owner?.profileImage, getFallbackAvatar(item.room?.owner?.username))}
                      alt={item.room?.owner?.username || 'owner'}
                      width="34"
                      height="34"
                      className="rounded-circle border"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackAvatar(item.room?.owner?.username); }}
                    />
                    <span>Owned by <strong className="text-light">{item.room?.owner?.username || 'Unknown'}</strong></span>
                  </div>
                </button>
              )) : <div className="alert alert-info mb-0">You have not joined any rooms yet.</div>}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
              <h5 className="mb-0">My Join Requests</h5>
              <span className="text-secondary small">{pendingRequests.length} pending</span>
            </div>
            <div className="d-grid gap-3">
              {pendingRequests.length ? pendingRequests.map((request) => (
                <div key={request.id} className="request-card request-card-column">
                  <div>
                    <div className="fw-semibold">{request.room?.name || 'Room'}</div>
                    <div className="d-flex gap-2 flex-wrap mt-2">
                      <span className="room-category-pill">{request.room?.category || 'General'}</span>
                      {request.room?.private && (
                        <span className="room-privacy-badge is-private">
                          <i className="bi bi-lock-fill" />
                          Private
                        </span>
                      )}
                      <span className="request-state-badge state-pending">{request.state || 'pending'}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline-danger btn-sm align-self-start align-self-md-center"
                    onClick={() => {
                      setRequestToCancel(request);
                      window.bootstrap.Modal.getOrCreateInstance(document.getElementById('cancelJoinRequestModal')).show();
                    }}
                  >
                    Cancel Request
                  </button>
                </div>
              )) : <div className="alert alert-info mb-0">You have no pending requests.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="cancelJoinRequestModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header">
              <h5 className="modal-title">Cancel join request</h5>
              <button className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              Are you sure you want to cancel your request for <strong>{requestToCancel?.room?.name || 'this room'}</strong>?
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Keep request</button>
              <button className="btn btn-danger" onClick={confirmCancelRequest} disabled={cancelingRequestId === requestToCancel?.id}>
                {cancelingRequestId === requestToCancel?.id ? 'Canceling...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
