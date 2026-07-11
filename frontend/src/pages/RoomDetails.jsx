import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { deleteMessage, getRoomDetails, getRoomMessages, getRoomSocketUrl, resolveMediaUrl, updateMessage } from '../api';

const getFallbackAvatar = (name) => {
  const safeName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff`;
};

const getUserId = (user) => user?.id || user?.user_id || null;
const NEAR_BOTTOM_THRESHOLD = 120;

function RoomDetails({ onApiStatusChange, showToast, currentUser, onOpenPublicProfile }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const roomId = typeof id === 'string' ? id.trim() : '';
  const isValidRoomId = Boolean(roomId);
  const preloadedRoom = location.state?.room;
  const canUsePreloadedRoom = Boolean(preloadedRoom && String(preloadedRoom.id) === roomId);

  const [room, setRoom] = useState(canUsePreloadedRoom ? preloadedRoom : null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(isValidRoomId);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [socketState, setSocketState] = useState('connecting');
  const [editingMessage, setEditingMessage] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);

  const wsRef = useRef(null);
  const messageListRef = useRef(null);

  const currentUsername = currentUser?.username || '';
  const currentUserId = getUserId(currentUser);
  const roomOwner = room?.owner?.username || '';
  const canAccessRoom = Boolean(
    room?.is_member
      ?? (Array.isArray(room?.members) && room.members.some((member) => member?.user?.username === currentUsername && !member?.leftDate)),
  );

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.sent_at || 0).getTime() - new Date(b.sent_at || 0).getTime()),
    [messages],
  );

  const handleOpenProfile = (user) => {
    const userId = getUserId(user);
    if (!userId) {
      showToast?.('Profile details unavailable', 'info');
      return;
    }

    onOpenPublicProfile?.(userId, user?.username);
  };

  const isNearBottom = () => {
    const node = messageListRef.current;
    if (!node) return true;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    return distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
  };
  
  const scrollToBottomInstant = () => {
  const node = messageListRef.current;
  if (!node) return;
  node.scrollTop = node.scrollHeight;
};

const scrollToBottomSmooth = () => {
  const node = messageListRef.current;
  if (!node) return;

  node.scrollTo({
    top: node.scrollHeight,
    behavior: 'smooth',
  });
};


  const loadRoom = async () => {
    if (!isValidRoomId) {
      setLoading(false);
      setError('Invalid room URL.');
      setMessages([]);
      setRoom(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const roomData = await getRoomDetails(roomId);
      setRoom(roomData || null);

      if (roomData?.is_member === false) {
        setMessages([]);
        showToast?.(roomData?.private ? 'You need to send a join request first.' : 'You need to join this room first.', 'danger');
        onApiStatusChange?.('connected');
        return;
      }

      const messageData = await getRoomMessages(roomId);
      setMessages(messageData || []);
      onApiStatusChange?.('connected');
    } catch (err) {
      setError(err.message || 'Failed to load room');
      setMessages([]);
      onApiStatusChange?.('error');
      showToast?.(err.message || 'Access denied', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  useEffect(() => {
  if (loading) return;
  if (!canAccessRoom) return;
  if (!sortedMessages.length) return;

  const t1 = setTimeout(() => {
    scrollToBottomInstant();

    const t2 = setTimeout(() => {
      scrollToBottomInstant();
    }, 50);

    return () => clearTimeout(t2);
  }, 0);

  return () => clearTimeout(t1);
}, [loading, roomId, canAccessRoom, sortedMessages.length]);

useEffect(() => {
  if (loading) return;

  const node = messageListRef.current;
  if (!node) return;
  if (!sortedMessages.length) return;

  const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
  const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;

  if (nearBottom) {
    scrollToBottomSmooth();
  }
}, [sortedMessages, loading]);

  useEffect(() => {
    if (!roomId || !canAccessRoom) return undefined;

    const socket = new window.WebSocket(getRoomSocketUrl(roomId));
    wsRef.current = socket;

    socket.onopen = () => {
      setSocketState('connected');
    };

    socket.onmessage = (event) => {
  try {
    const parsed = JSON.parse(event.data);
    const incoming =
      parsed?.type === 'chat_message' && parsed?.message
        ? parsed.message
        : parsed?.content
        ? parsed
        : null;

    if (!incoming) return;

    setMessages((prev) => {
  if (incoming?.id && prev.some((msg) => msg.id === incoming.id)) {
    return prev;
  }
  return [...prev, incoming];
});

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    scrollToBottomSmooth();
  });
});
  } catch (err) {
    window.console.error('[RoomDetails] failed to parse websocket payload:', err);
  }
};

    socket.onerror = () => {
      setSocketState('error');
      showToast?.('Chat connection error.', 'danger');
    };

    socket.onclose = () => {
      setSocketState('disconnected');
    };

    return () => {
      if (wsRef.current === socket) wsRef.current = null;
      if (socket.readyState === window.WebSocket.OPEN || socket.readyState === window.WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [roomId, canAccessRoom, currentUserId, currentUsername]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      showToast?.('Message cannot be empty.', 'danger');
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== window.WebSocket.OPEN) {
      showToast?.('Cannot send message while disconnected.', 'danger');
      return;
    }

    wsRef.current.send(JSON.stringify({ content: trimmed }));
    setContent('');
  };

  const handleEditMessage = async (e) => {
    e.preventDefault();
    if (!editingMessage?.content?.trim()) {
      showToast?.('Message content is required.', 'danger');
      return;
    }

    try {
      const updated = await updateMessage(roomId, editingMessage.id, editingMessage.content.trim());
      setMessages((prev) => prev.map((msg) => (msg.id === editingMessage.id ? { ...msg, ...updated, content: updated.content || editingMessage.content.trim() } : msg)));
      window.bootstrap.Modal.getOrCreateInstance(document.getElementById('editMessageModal')).hide();
      showToast?.('Message updated.', 'success');
    } catch (err) {
      showToast?.(err.message || 'You are not allowed to edit this message.', 'danger');
    }
  };

  const handleDeleteMessage = async () => {
    if (!deletingMessage) return;

    try {
      await deleteMessage(roomId, deletingMessage.id);
      setMessages((prev) => prev.filter((msg) => msg.id !== deletingMessage.id));
      window.bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteMessageModal')).hide();
      showToast?.('Message deleted.', 'success');
    } catch (err) {
      showToast?.(err.message || 'You are not allowed to delete this message.', 'danger');
    }
  };

  const roomInitial = (room?.name || 'R').charAt(0).toUpperCase();

  if (loading) {
    return <div className="container-fluid py-4 px-3 px-lg-4"><div className="text-center py-5"><div className="spinner-border" /></div></div>;
  }

  if (!isValidRoomId) {
    return (
      <div className="container-fluid py-4 px-3 px-lg-4">
        <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3">
          <span>Invalid room URL.</span>
          <button className="btn btn-sm btn-outline-danger" onClick={() => navigate('/home')}>Back to rooms</button>
        </div>
      </div>
    );
  }

  const lockedMessage = room?.private ? 'You need to send a join request first.' : 'You need to join this room first.';

  return (
    <div className="room-page-layout">
      {error && (
        <div className="alert alert-danger m-3 d-flex align-items-center justify-content-between gap-3">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={loadRoom}>Retry</button>
        </div>
      )}

      {!canAccessRoom ? (
        <div className="container-fluid py-4 px-3 px-lg-4">
          <div className="room-locked-state card border-0 shadow-sm rounded-4 p-4 p-lg-5 text-center mx-auto soft-enter-panel">
            <div className="display-5 mb-3"><i className={`bi ${room?.private ? 'bi-lock-fill' : 'bi-door-open-fill'}`} /></div>
            <h2 className="mb-3">Access required</h2>
            <p className="text-secondary mb-4">{lockedMessage}</p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <button className="btn btn-outline-secondary" onClick={() => navigate('/home')}>Back to rooms</button>
              <button className="btn btn-primary" onClick={() => navigate(`/room/${roomId}/info`)}>Open Room Info</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-shell">
          <button className="chat-header-bar" onClick={() => navigate(`/room/${roomId}/info`)}>
            <div className="chat-room-avatar" aria-hidden="true">{roomInitial}</div>
            <div className="d-flex flex-column text-start">
              <span className="chat-header-label">Room</span>
              <span className="chat-header-name">{room?.name || 'Room'}</span>
            </div>
            <i className="bi bi-chevron-right text-secondary ms-auto" />
          </button>

          <div className="chat-body" ref={messageListRef}>
            {sortedMessages.length ? (
              sortedMessages.map((message, index) => {
                const messageUser = message?.user || {};
                const messageUsername = messageUser?.username || '';
                const isCurrentUser = currentUsername && messageUsername === currentUsername;
                const canEdit = isCurrentUser;
                const canDelete = isCurrentUser || (currentUsername && currentUsername === roomOwner);

                return (
                  <div key={message.id || index} className={`d-flex chat-message-row chat-message-appear ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div className="d-flex gap-2 chat-message-wrap">
                      {!isCurrentUser && (
                        <button type="button" className="btn p-0 border-0 bg-transparent align-self-end public-profile-trigger" onClick={() => handleOpenProfile(messageUser)}>
                          <img
                            src={resolveMediaUrl(messageUser?.profileImage, getFallbackAvatar(messageUser?.username))}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackAvatar(messageUser?.username); }}
                            alt="user"
                            width="34"
                            height="34"
                            className="rounded-circle border"
                          />
                        </button>
                      )}

                      <div className={`card border-0 chat-message-bubble ${isCurrentUser ? 'chat-message mine' : 'chat-message other'}`}>
                        <div className="chat-message-header">
                          <button type="button" className="small text-secondary fw-semibold btn p-0 border-0 bg-transparent public-profile-trigger chat-message-author" onClick={() => handleOpenProfile(messageUser)}>
                            {messageUsername || 'User'}
                          </button>
                          <div className="chat-message-header-actions">
                            <div className="chat-message-meta small text-secondary">{message?.sent_at ? new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                            {(canEdit || canDelete) && (
                              <div className="dropdown">
                                <button className="btn btn-sm btn-outline-secondary py-0 px-1" data-bs-toggle="dropdown"><i className="bi bi-three-dots" /></button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  {canEdit && <li><button className="dropdown-item" onClick={() => {
                                    setEditingMessage({ id: message.id, content: message.content || '' });
                                    window.bootstrap.Modal.getOrCreateInstance(document.getElementById('editMessageModal')).show();
                                  }}>Edit message</button></li>}
                                  {canDelete && <li><button className="dropdown-item text-danger" onClick={() => {
                                    setDeletingMessage(message);
                                    window.bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteMessageModal')).show();
                                  }}>Delete message</button></li>}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="chat-message-content" dir="auto">{message?.content || ''}</div>
                      </div>

                      {isCurrentUser && (
                        <button type="button" className="btn p-0 border-0 bg-transparent align-self-end public-profile-trigger" onClick={() => handleOpenProfile(messageUser)}>
                          <img
                            src={resolveMediaUrl(messageUser?.profileImage, getFallbackAvatar(messageUser?.username))}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFallbackAvatar(messageUser?.username); }}
                            alt="user"
                            width="34"
                            height="34"
                            className="rounded-circle border"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="chat-empty-state" role="status" aria-live="polite">
                <div className="chat-empty-state-card">
                  <p className="chat-empty-state-title mb-1">No messages yet.</p>
                  <p className="chat-empty-state-text mb-0">Start the conversation.</p>
                </div>
              </div>
            )}
          </div>

          <form className="chat-input-bar" onSubmit={handleSend}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-secondary">Chat status: {socketState}</small>
            </div>
            <div className="d-flex gap-2 align-items-end">
              <input
                type="text"
                className="form-control"
                placeholder="Write a message..."
                value={content}
                dir="auto"
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                required
              />
              <button className="btn btn-primary" disabled={socketState !== 'connected'}>Send</button>
            </div>
          </form>
        </div>
      )}

      <div className="modal fade" id="editMessageModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 soft-enter-panel">
            <div className="modal-header"><h5 className="modal-title">Edit message</h5><button className="btn-close" data-bs-dismiss="modal" /></div>
            <form onSubmit={handleEditMessage}>
              <div className="modal-body">
                <textarea className="form-control" rows="4" dir="auto" value={editingMessage?.content || ''} onChange={(e) => setEditingMessage((prev) => ({ ...prev, content: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="deleteMessageModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 soft-enter-panel">
            <div className="modal-header"><h5 className="modal-title">Delete message</h5><button className="btn-close" data-bs-dismiss="modal" /></div>
            <div className="modal-body">Are you sure you want to delete this message?</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteMessage}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomDetails;
