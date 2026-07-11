// const ENVIRONMENT = import.meta.env.VITE_ENV

// const BACKEND_ORIGIN = ENVIRONMENT === 'prod' ? 'unisotropous-lauren-persuadably.ngrok-free.dev' : '127.0.0.1:8000';
const DEFAULT_API_BASE = `/api/`;
const DEFAULT_WS_BASE = `/ws/`;

const FALLBACK_AVATAR = 'https://ui-avatars.com/api/?name=User&background=6f33df&color=fff';
const FALLBACK_BANNER = 'https://i.ibb.co/PZ2kM0Rd/mates-banner.png';

const normalizeBase = (baseUrl, fallback) => {
  const value = baseUrl || fallback;
  return value.endsWith('/') ? value : `${value}/`;
};

export const API_BASE_URL = normalizeBase(import.meta.env.VITE_API_BASE_URL, DEFAULT_API_BASE);
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const deriveWsBaseFromApiBase = (apiBase) => {
  try {
    const parsed = new window.URL(apiBase);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}/ws/`;
  } catch {
    return DEFAULT_WS_BASE;
  }
};

export const WS_BASE_URL = normalizeBase(
  import.meta.env.VITE_WS_BASE_URL,
  deriveWsBaseFromApiBase(API_BASE_URL),
);

const getErrorMessageFromObject = (errorData, fallbackMessage) => {
  if (!errorData || typeof errorData !== 'object') return fallbackMessage;
  if (typeof errorData.detail === 'string') return errorData.detail;
  if (typeof errorData.message === 'string') return errorData.message;
  if (typeof errorData.error === 'string') return errorData.error;

  const firstKey = Object.keys(errorData)[0];
  const firstValue = firstKey ? errorData[firstKey] : null;

  if (Array.isArray(firstValue) && firstValue.length) return String(firstValue[0]);
  if (typeof firstValue === 'string') return firstValue;

  return fallbackMessage;
};

const parseApiError = async (response, fallbackMessage) => {
  const errorData = await response.json().catch(() => ({}));
  return getErrorMessageFromObject(errorData, fallbackMessage);
};

export function getAuthHeaders() {
  const token = localStorage.getItem('accessToken') || '';
  return {
    Authorization: `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true',
  };
}

export function resolveMediaUrl(url, fallback = FALLBACK_AVATAR) {
  if (!url) return fallback;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${BACKEND_BASE_URL}${url}`;
  return fallback;
}

export function getDefaultBanner(name = 'Mates') {
  const safeName = encodeURIComponent(name || 'Mates');
  return `${FALLBACK_BANNER}&sig=${safeName}`;
}

export function getRoomSocketUrl(roomId) {
  const token = localStorage.getItem('accessToken') || '';
  const encodedToken = encodeURIComponent(token);
  return `${WS_BASE_URL}message/${encodeURIComponent(roomId)}/?token=${encodedToken}`;
}

async function fetchJson(path, options = {}, fallbackMessage = 'Request failed') {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) throw new Error(await parseApiError(response, fallbackMessage));
  return response.json().catch(() => ({}));
}

async function fetchList(path, fallbackMessage) {
  const data = await fetchJson(path, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  }, fallbackMessage);
  return Array.isArray(data) ? data : data.results || [];
}

export async function registerUser({ username, email, password, confirmPassword }) {
  return fetchJson('auth/registration/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password1: password,
      password2: confirmPassword,
    }),
  }, 'Register failed');
}

export async function loginUser(email, password) {
  const data = await fetchJson('auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }, 'Login failed');

  const accessToken = data.key || data.token || data.access || data.access_token || '';
  const refreshToken = data.refresh || data.refresh_token || '';

  if (!accessToken) throw new Error('Login succeeded but token was missing in response.');

  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

  return data;
}

export async function resetPassword(email) {
  return fetchJson('auth/password/reset/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }, 'Failed to send reset password request');
}

export async function getCurrentUser() {
  return fetchJson('auth/user/', {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  }, 'Failed to load user profile');
}

export async function getPublicProfile(userId) {
  return fetchJson(`auth/profile/${userId}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  }, 'Failed to load public profile');
}

export async function updateCurrentUser(payload) {
  return fetchJson('auth/user/', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  }, 'Failed to update profile');
}

export async function changePassword({ newPassword1, newPassword2 }) {
  return fetchJson('auth/password/change/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      new_password1: newPassword1,
      new_password2: newPassword2,
    }),
  }, 'Failed to change password');
}

export async function getRooms() {
  return fetchList('rooms/', 'Failed to load rooms');
}

export async function getJoinedRooms() {
  return fetchList('rooms/joinedrooms/', 'Failed to load joined rooms');
}

export async function getMyPendingRequests() {
  return fetchList('rooms/pendingrequsts/', 'Failed to load your join requests');
}

export async function cancelJoinRequest(requestId) {
  const response = await fetch(`${API_BASE_URL}rooms/cancelrequest/${requestId}/`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) throw new Error(await parseApiError(response, 'Failed to cancel request'));
  return true;
}

export async function createRoom(roomData) {
  return fetchJson('rooms/create/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      ...roomData,
      private: Boolean(roomData.private),
    }),
  }, 'Failed to create room');
}

export async function getRoomDetails(roomId) {
  return fetchJson(`rooms/room/${roomId}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  }, 'Failed to load room details');
}

export async function joinRoom(roomId) {
  return fetchJson(`rooms/join/${roomId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  }, 'Failed to join room');
}

export async function leaveRoom(roomId) {
  return fetchJson(`rooms/leave/${roomId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  }, 'Failed to leave room');
}

export async function getPendingRequests(roomId) {
  return fetchList(`rooms/pendingrequsts/${roomId}/`, 'Failed to load pending requests');
}

export async function getOldRequests(roomId) {
  return fetchList(`rooms/oldrequsts/${roomId}/`, 'Failed to load old requests');
}

export async function handleRoomRequest(roomId, requestId, state) {
  return fetchJson(`rooms/reqhandel/${roomId}/${requestId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ state }),
  }, `Failed to mark request as ${state}`);
}

export async function updateRoom(roomId, payload) {
  return fetchJson(`rooms/modify/${roomId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  }, 'Failed to update room');
}

export async function deleteRoom(roomId) {
  const response = await fetch(`${API_BASE_URL}rooms/modify/${roomId}/`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) throw new Error(await parseApiError(response, 'Failed to delete room'));
  return true;
}

export async function getRoomMessages(roomId) {
  const response = await fetch(`${API_BASE_URL}messages/${roomId}/`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) throw new Error(await parseApiError(response, 'Failed to load messages'));
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function updateMessage(roomId, messageId, content) {
  return fetchJson(`messages/mod/${roomId}/${messageId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  }, 'Failed to edit message');
}

export async function deleteMessage(roomId, messageId) {
  const response = await fetch(`${API_BASE_URL}messages/del/${roomId}/${messageId}/`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) throw new Error(await parseApiError(response, 'Failed to delete message'));
  return true;
}

export async function sendFeedback({ content }) {
  return fetchJson('messages/sendfeedback/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content }),
  }, 'Failed to send feedback');
}
