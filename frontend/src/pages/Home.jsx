import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, deleteRoom, getRooms, joinRoom, leaveRoom, resolveMediaUrl, updateRoom } from '../api';

const ROOM_CATEGORIES = ['study', 'games', 'programing', 'life issues', 'other'];

const getFallbackAvatar = (name) => {
  const safeName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff`;
};

const getActiveMembers = (members = []) => members.filter((member) => !member?.leftDate);

function Home({ currentUser, selectedCategory, createRoomRequest, refreshRoomsRequest, onApiStatusChange, showToast, onJoinedRoomsChange }) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [togglingRoomId, setTogglingRoomId] = useState(null);
  const [joinGateRoom, setJoinGateRoom] = useState(null);

  const [newRoom, setNewRoom] = useState({ name: '', category: ROOM_CATEGORIES[0], description: '', private: false });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingRoom, setEditingRoom] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const currentUsername = currentUser?.username || '';

  const loadRooms = async () => {
    setError('');
    setLoading(true);

    try {
      const data = await getRooms();
      setRooms(data || []);
      onApiStatusChange('connected');
      return data || [];
    } catch (err) {
      setError(err.message);
      onApiStatusChange('error');
      showToast?.(err.message || 'Failed to load rooms', 'danger');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (refreshRoomsRequest > 0) loadRooms();
  }, [refreshRoomsRequest]);

  useEffect(() => {
    if (createRoomRequest > 0) {
      const modalEl = document.getElementById('createRoomModal');
      if (modalEl && window.bootstrap) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    }
  }, [createRoomRequest]);

  useEffect(() => {
    if (!joinGateRoom || !window.bootstrap) return;
    const modalEl = document.getElementById('joinGateModal');
    if (modalEl) {
      window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  }, [joinGateRoom]);

  const filteredRooms = useMemo(() => {
    const text = search.toLowerCase();
    return rooms.filter((room) => {
      const name = (room.name || '').toLowerCase();
      const category = (room.category || '').toLowerCase();
      const description = (room.description || '').toLowerCase();
      const matchesSearch = name.includes(text) || category.includes(text) || description.includes(text);
      const matchesCategory = selectedCategory ? category === selectedCategory.toLowerCase() : true;
      return matchesSearch && matchesCategory;
    });
  }, [rooms, search, selectedCategory]);

  const submitCreateRoom = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newRoom.name.trim() || !newRoom.category) {
      setCreateError('Room name and category are required.');
      return;
    }

    setCreating(true);

    try {
      await createRoom({
        name: newRoom.name.trim(),
        description: newRoom.description.trim(),
        category: newRoom.category,
        private: Boolean(newRoom.private),
      });
      setNewRoom({ name: '', category: ROOM_CATEGORIES[0], description: '', private: false });
      window.bootstrap.Modal.getOrCreateInstance(document.getElementById('createRoomModal')).hide();
      showToast?.('Room created', 'success');
      loadRooms();
    } catch (err) {
      setCreateError(err.message);
      onApiStatusChange('error');
      showToast?.(err.message || 'Room create failed', 'danger');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRoom = (room) => {
    if (room.is_member) {
      navigate(`/room/${room.id}`);
      return;
    }

    setJoinGateRoom(room);
    showToast?.(room.private ? 'You need to send a join request first.' : 'You need to join this room first.', 'info');
  };

  const handleJoinLeave = async (room, event) => {
    event?.stopPropagation?.();
    setTogglingRoomId(room.id);

    try {
      if (room.is_member) {
        const response = await leaveRoom(room.id);
        await loadRooms();
        showToast?.(response?.message || 'Left room', 'success');
      } else {
        const response = await joinRoom(room.id);
        const refreshedRooms = await loadRooms();
        const refreshedRoom = refreshedRooms.find((item) => item.id === room.id);
        const message = response?.message || (room.private && !refreshedRoom?.is_member ? 'Join request sent' : 'Joined room');
        showToast?.(message, 'success');
      }
    } catch (err) {
      showToast?.(err.message || 'Failed join/leave', 'danger');
    } finally {
      setTogglingRoomId(null);
    }
  };

  const submitEditRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom?.name?.trim()) {
      showToast?.('Room name is required.', 'danger');
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await updateRoom(editingRoom.id, {
        name: editingRoom.name.trim(),
        description: editingRoom.description || '',
        category: editingRoom.category,
        private: Boolean(editingRoom.private),
      });

      setRooms((prev) => prev.map((room) => (room.id === editingRoom.id ? { ...room, ...updated } : room)));
      window.bootstrap.Modal.getOrCreateInstance(document.getElementById('editRoomModal')).hide();
      showToast?.('Room updated successfully.', 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to update room', 'danger');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!deletingRoom) return;

    try {
      await deleteRoom(deletingRoom.id);
      setRooms((prev) => prev.filter((room) => room.id !== deletingRoom.id));
      onJoinedRoomsChange?.((prev) => prev.filter((item) => item?.room?.id !== deletingRoom.id && item?.id !== deletingRoom.id));
      window.bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteRoomModal')).hide();
      showToast?.('Room deleted successfully.', 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to delete room', 'danger');
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Rooms</h2>
          {selectedCategory && <small className="text-secondary">Filtering by: {selectedCategory}</small>}
        </div>
        <button className="btn btn-primary rounded-3" data-bs-toggle="modal" data-bs-target="#createRoomModal">Create Room</button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
        <input className="form-control" placeholder="Search rooms by name/category/description" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3" role="alert">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-light" onClick={loadRooms}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : (
        <div className="row g-3">
          {filteredRooms.map((room, index) => {
            const isOwner = currentUsername && room.owner?.username === currentUsername;
            const activeMembers = getActiveMembers(room.members);
            const previewMembers = activeMembers.slice(-5);
            const remainingMembers = Math.max(activeMembers.length - previewMembers.length, 0);
            const membersCount = room.membersCount ?? activeMembers.length;

            return (
              <div key={room.id} className="col-12 col-lg-6 room-card-appear" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                <div
                  className="card room-card h-100 border-0 shadow-sm rounded-4"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenRoom(room)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleOpenRoom(room);
                  }}
                >
                  <div className="card-body d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <button className="btn btn-link text-start p-0 text-decoration-none room-title" onClick={(e) => { e.stopPropagation(); handleOpenRoom(room); }}>
                        {room.name || 'Untitled Room'}
                      </button>

                      {isOwner && (
                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                            <i className="bi bi-three-dots" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li><button className="dropdown-item" onClick={() => {
                              setEditingRoom({
                                id: room.id,
                                name: room.name || '',
                                description: room.description || '',
                                category: room.category || ROOM_CATEGORIES[0],
                                private: Boolean(room.private),
                              });
                              window.bootstrap.Modal.getOrCreateInstance(document.getElementById('editRoomModal')).show();
                            }}>Edit room</button></li>
                            <li><button className="dropdown-item text-danger" onClick={() => {
                              setDeletingRoom(room);
                              window.bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteRoomModal')).show();
                            }}>Delete room</button></li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="room-owner-row d-flex align-items-center gap-2">
                      <img
                        src={resolveMediaUrl(room.owner?.profileImage, getFallbackAvatar(room.owner?.username))}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackAvatar(room.owner?.username); }}
                        alt="owner"
                        width="32"
                        height="32"
                        className="rounded-circle border"
                      />
                      <small className="fw-semibold">{room.owner?.username || 'Unknown owner'}</small>
                    </div>

                    <div className="room-meta d-flex flex-wrap align-items-center gap-2">
                      <span className="room-category-pill">{room.category || 'General'}</span>
                      <span className={`room-privacy-badge ${room.private ? 'is-private' : 'is-public'}`}>
                        <i className={`bi ${room.private ? 'bi-lock-fill' : 'bi-globe2'}`} />
                        {room.private ? 'Private' : 'Public'}
                      </span>
                    </div>

                    <p className="room-desc text-secondary flex-grow-1 mb-0">{room.description || 'No description yet.'}</p>

                    <div className="member-preview-row d-flex align-items-center justify-content-between gap-3 flex-wrap">
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div className="member-avatar-stack" aria-hidden="true">
                          {previewMembers.map((member, index) => (
                            <img
                              key={`${member?.user?.username || index}-${index}`}
                              src={resolveMediaUrl(member?.user?.profileImage, getFallbackAvatar(member?.user?.username))}
                              alt={member?.user?.username || 'member'}
                              className="member-stack-avatar"
                              style={{ zIndex: index + 1 }}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackAvatar(member?.user?.username); }}
                            />
                          ))}
                          {remainingMembers > 0 && <span className="member-stack-count">+{remainingMembers}</span>}
                        </div>
                        <small className="text-secondary">{membersCount} member{membersCount === 1 ? '' : 's'}</small>
                      </div>

                      <div className="room-footer gap-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={(e) => { e.stopPropagation(); handleOpenRoom(room); }}>Open Room</button>
                        <button className="btn btn-outline-primary rounded-3 px-4" onClick={(e) => handleJoinLeave(room, e)} disabled={togglingRoomId === room.id}>
                          {togglingRoomId === room.id ? '...' : room.is_member ? 'Leave' : room.private ? 'Request Join' : 'Join'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!filteredRooms.length && <div className="col-12"><div className="alert alert-info mb-0">No rooms found.</div></div>}
        </div>
      )}

      <div className="modal fade" id="createRoomModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header">
              <h5 className="modal-title">Create a room</h5>
              <button className="btn-close" data-bs-dismiss="modal" />
            </div>
            <form onSubmit={submitCreateRoom}>
              <div className="modal-body d-grid gap-3">
                {createError && <div className="alert alert-danger mb-0">{createError}</div>}
                <input className="form-control" placeholder="Room name" required value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} />
                <select className="form-select" value={newRoom.category} onChange={(e) => setNewRoom({ ...newRoom, category: e.target.value })} required>
                  {ROOM_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <textarea className="form-control" placeholder="Description" rows="3" value={newRoom.description} onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })} />
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="privateRoomSwitch" checked={newRoom.private} onChange={(e) => setNewRoom({ ...newRoom, private: e.target.checked })} />
                  <label className="form-check-label" htmlFor="privateRoomSwitch">Private Room</label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
                <button className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="editRoomModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header">
              <h5 className="modal-title">Edit room</h5>
              <button className="btn-close" data-bs-dismiss="modal" />
            </div>
            <form onSubmit={submitEditRoom}>
              <div className="modal-body d-grid gap-3">
                <input className="form-control" placeholder="Room name" required value={editingRoom?.name || ''} onChange={(e) => setEditingRoom((prev) => ({ ...prev, name: e.target.value }))} />
                <select className="form-select" value={editingRoom?.category || ROOM_CATEGORIES[0]} onChange={(e) => setEditingRoom((prev) => ({ ...prev, category: e.target.value }))}>
                  {ROOM_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <textarea className="form-control" rows="3" value={editingRoom?.description || ''} onChange={(e) => setEditingRoom((prev) => ({ ...prev, description: e.target.value }))} />
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="editPrivateRoomSwitch" checked={Boolean(editingRoom?.private)} onChange={(e) => setEditingRoom((prev) => ({ ...prev, private: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="editPrivateRoomSwitch">Private Room</label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
                <button className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save changes'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="deleteRoomModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header">
              <h5 className="modal-title">Delete room</h5>
              <button className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              Are you sure you want to delete <strong>{deletingRoom?.name || 'this room'}</strong>? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" data-bs-dismiss="modal" type="button">Cancel</button>
              <button className="btn btn-danger" onClick={confirmDeleteRoom}>Delete room</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade room-info-modal" id="joinGateModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title">Room access locked</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={() => setJoinGateRoom(null)} />
            </div>
            <div className="modal-body text-center py-4">
              <div className="display-6 mb-3"><i className={`bi ${joinGateRoom?.private ? 'bi-lock-fill' : 'bi-door-open-fill'}`} /></div>
              <h4 className="mb-2">{joinGateRoom?.private ? 'You need to send a join request first.' : 'You need to join this room first.'}</h4>
              <p className="text-secondary mb-0">Join the room before opening its chat. Private rooms will send a request to the owner or admin team.</p>
            </div>
            <div className="modal-footer justify-content-center border-0 pt-0">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={() => setJoinGateRoom(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!joinGateRoom || togglingRoomId === joinGateRoom.id}
                onClick={async (e) => {
                  if (!joinGateRoom) return;
                  await handleJoinLeave(joinGateRoom, e);
                  window.bootstrap.Modal.getOrCreateInstance(document.getElementById('joinGateModal')).hide();
                  setJoinGateRoom(null);
                }}
              >
                {togglingRoomId === joinGateRoom?.id ? 'Please wait...' : joinGateRoom?.private ? 'Request Join' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
