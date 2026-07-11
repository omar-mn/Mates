import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOldRequests, getPendingRequests, getRoomDetails, handleRoomRequest, resolveMediaUrl } from '../api';

const getFallbackAvatar = (name) => {
  const safeName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff`;
};

const getRequestUser = (request) => request?.user || request?.requested_by || request?.request_user || null;
const getRequestState = (request) => request?.state || request?.status || 'pending';
const getRequestId = (request) => request?.id || request?.request_id || request?.pk;

function RoomInfo({ currentUser, onApiStatusChange, showToast, onOpenPublicProfile }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [oldRequests, setOldRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [actingRequestId, setActingRequestId] = useState(null);

  const currentUsername = currentUser?.username || '';
  const currentMembership = useMemo(
    () => room?.members?.find((member) => member?.user?.username === currentUsername && !member?.leftDate),
    [room, currentUsername],
  );
  const canManageRequests = ['owner', 'admin'].includes(currentMembership?.role);

  const loadRoomInfo = async () => {
    setLoading(true);
    try {
      const roomData = await getRoomDetails(id);
      setRoom(roomData || null);
      onApiStatusChange?.('connected');
      return roomData;
    } catch (err) {
      onApiStatusChange?.('error');
      showToast?.(err.message || 'Room info fetch failed', 'danger');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const [pendingData, oldData] = await Promise.all([getPendingRequests(id), getOldRequests(id)]);
      setPendingRequests(pendingData || []);
      setOldRequests(oldData || []);
    } catch (err) {
      showToast?.(err.message || 'Pending/old requests fetch failed', 'danger');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadRoomInfo();
  }, [id]);

  useEffect(() => {
    if (canManageRequests) {
      loadRequests();
    }
  }, [id, canManageRequests]);

  const handleRequestAction = async (requestId, state) => {
    setActingRequestId(requestId);
    try {
      await handleRoomRequest(id, requestId, state);
      await Promise.all([loadRequests(), loadRoomInfo()]);
      showToast?.(state === 'accepted' ? 'Request accepted' : 'Request rejected', 'success');
    } catch (err) {
      showToast?.(err.message || 'Permission errors', 'danger');
    } finally {
      setActingRequestId(null);
    }
  };

  if (loading) {
    return <div className="container-fluid py-4 px-3 px-lg-4 detail-page-shell"><div className="text-center py-5"><div className="spinner-border" /></div></div>;
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4 detail-page-shell">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2 className="mb-1">Room Info</h2>
          <p className="text-secondary mb-0">A quick overview of the room, members, and join requests.</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate(`/room/${id}`)}>Back to chat</button>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="info-card info-section h-100 soft-enter-panel">
            <div className="info-label mb-2">Summary</div>
            <h3 className="mb-3">{room?.name || 'Room'}</h3>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="room-category-pill">{room?.category || 'General'}</span>
              <span className={`room-privacy-badge ${room?.private ? 'is-private' : 'is-public'}`}>
                <i className={`bi ${room?.private ? 'bi-lock-fill' : 'bi-globe2'}`} />
                {room?.private ? 'Private' : 'Public'}
              </span>
              <span className="request-state-badge state-neutral">{room?.membersCount ?? 0} members</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="info-card info-section h-100">
            <div className="info-label mb-2">Owner</div>
            <div className="d-flex align-items-center gap-3">
              <button
                className="btn p-0 border-0 bg-transparent public-profile-trigger"
                onClick={() => onOpenPublicProfile?.(room?.owner?.id, room?.owner?.username)}
                type="button"
              >
                <img
                  src={resolveMediaUrl(room?.owner?.profileImage, getFallbackAvatar(room?.owner?.username))}
                  alt={room?.owner?.username || 'owner'}
                  width="64"
                  height="64"
                  className="rounded-circle border"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackAvatar(room?.owner?.username); }}
                />
              </button>
              <div>
                <button
                  type="button"
                  className="btn p-0 border-0 bg-transparent info-value fw-semibold public-profile-trigger"
                  onClick={() => onOpenPublicProfile?.(room?.owner?.id, room?.owner?.username)}
                >
                  {room?.owner?.username || 'Unknown owner'}
                </button>
                <div className="text-secondary">Room owner</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="info-card info-section">
            <div className="info-label mb-2">Description</div>
            <div className="info-value">{room?.description || 'No description available yet.'}</div>
          </div>
        </div>

        <div className="col-12">
          <div className="info-card info-section">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="info-label mb-0">Members</div>
              <span className="text-secondary">{room?.membersCount ?? room?.members?.length ?? 0} total members</span>
            </div>
            <div className="row g-3">
              {(room?.members || []).filter((member) => !member?.leftDate).map((member, index) => (
                <div className="col-12 col-md-6 col-xl-4" key={`${member?.user?.username || index}-${member?.role || index}`}>
                  <div className="member-card h-100">
                    <button
                      type="button"
                      className="btn p-0 border-0 bg-transparent public-profile-trigger"
                      onClick={() => onOpenPublicProfile?.(member?.user?.id, member?.user?.username)}
                    >
                      <img
                        src={resolveMediaUrl(member?.user?.profileImage, getFallbackAvatar(member?.user?.username))}
                        alt={member?.user?.username || 'member'}
                        width="52"
                        height="52"
                        className="rounded-circle border"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackAvatar(member?.user?.username); }}
                      />
                    </button>
                    <div>
                      <button
                        type="button"
                        className="btn p-0 border-0 bg-transparent fw-semibold public-profile-trigger"
                        onClick={() => onOpenPublicProfile?.(member?.user?.id, member?.user?.username)}
                      >
                        {member?.user?.username || 'Unknown user'}
                      </button>
                      <span className="request-state-badge state-neutral text-capitalize">{member?.role || 'member'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {canManageRequests && (
          <>
            <div className="col-12">
              <div className="info-card info-section">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div className="info-label mb-0">Pending Requests</div>
                  {requestsLoading && <span className="text-secondary">Loading requests…</span>}
                </div>
                <div className="d-grid gap-3">
                  {pendingRequests.length ? pendingRequests.map((request, index) => {
                    const requestUser = getRequestUser(request);
                    const requestId = getRequestId(request) || index;
                    return (
                      <div key={requestId} className="request-card">
                        <div>
                          <div className="fw-semibold">{requestUser?.username || `User ID: ${requestUser?.id || request?.user_id || 'Unknown'}`}</div>
                          <div className="text-secondary small">Request ID: {requestId}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                          <span className="request-state-badge state-pending">{getRequestState(request)}</span>
                          <button className="btn btn-sm btn-primary" disabled={actingRequestId === requestId} onClick={() => handleRequestAction(requestId, 'accepted')}>Accept</button>
                          <button className="btn btn-sm btn-outline-secondary" disabled={actingRequestId === requestId} onClick={() => handleRequestAction(requestId, 'rejected')}>Reject</button>
                        </div>
                      </div>
                    );
                  }) : <div className="alert alert-info mb-0">No pending requests.</div>}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="info-card info-section">
                <div className="info-label mb-3">Old Requests</div>
                <div className="d-grid gap-3">
                  {oldRequests.length ? oldRequests.map((request, index) => {
                    const requestUser = getRequestUser(request);
                    const requestId = getRequestId(request) || index;
                    const requestState = getRequestState(request);
                    return (
                      <div key={`${requestId}-${requestState}`} className="request-card">
                        <div>
                          <div className="fw-semibold">{requestUser?.username || `User ID: ${requestUser?.id || request?.user_id || 'Unknown'}`}</div>
                          <div className="text-secondary small">Request ID: {requestId}</div>
                        </div>
                        <span className={`request-state-badge ${requestState === 'accepted' ? 'state-accepted' : 'state-rejected'}`}>{requestState}</span>
                      </div>
                    );
                  }) : <div className="alert alert-info mb-0">No old requests yet.</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RoomInfo;
