/**
 * LASU Boardroom — Frontend API Client
 * ─────────────────────────────────────
 * Drop this file into your React project as:  src/api.js
 *
 * Usage in App.jsx:
 *   import api from './api';
 *
 *   // Auth
 *   const { accessToken, user } = await api.auth.login(email, password);
 *
 *   // Send invitations via backend (real email)
 *   await api.email.sendInvitations(meeting);
 *
 *   // Transcribe audio
 *   const { transcript } = await api.transcription.upload(audioBlob);
 *
 *   // Cloud sync
 *   await api.sync.push({ meetingHistory, contacts, groups });
 *   const cloudData = await api.sync.pull();
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Token management ─────────────────────────────────────────────────────────
const getToken  = ()        => localStorage.getItem('lasu_token');
const setToken  = (token)   => localStorage.setItem('lasu_token', token);
const clearAuth = ()        => { localStorage.removeItem('lasu_token'); localStorage.removeItem('lasu_refresh'); };
const getRefresh = ()       => localStorage.getItem('lasu_refresh');
const setRefresh = (token)  => localStorage.setItem('lasu_refresh', token);

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
const request = async (method, path, body = null, isFormData = false) => {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const config = {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
  };

  let res = await fetch(`${BASE_URL}${path}`, config);

  // Auto-refresh token if expired
  if (res.status === 401 && getRefresh()) {
    try {
      const refresh = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: getRefresh() }),
      });
      if (refresh.ok) {
        const { accessToken } = await refresh.json();
        setToken(accessToken);
        headers['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(`${BASE_URL}${path}`, { ...config, headers });
      }
    } catch (_) {}
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status, data: err });
  }

  return res.json();
};

// ─── API modules ──────────────────────────────────────────────────────────────

const auth = {
  /** Register a new account */
  register: (name, email, password) =>
    request('POST', '/api/auth/register', { name, email, password }),

  /** Login and store tokens */
  login: async (email, password) => {
    const data = await request('POST', '/api/auth/login', { email, password });
    setToken(data.accessToken);
    setRefresh(data.refreshToken);
    return data;
  },

  /** Get current logged-in user */
  me: () => request('GET', '/api/auth/me'),

  /** Log out (clear tokens) */
  logout: () => clearAuth(),

  /** Check if user is currently logged in */
  isLoggedIn: () => !!getToken(),
};

const meetings = {
  /** Get all meetings (supports filter, sort, search params) */
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/meetings${qs ? '?' + qs : ''}`);
  },

  /** Create a meeting */
  create: (meeting) => request('POST', '/api/meetings', meeting),

  /** Update a meeting */
  update: (id, data) => request('PUT', `/api/meetings/${id}`, data),

  /** Delete a meeting */
  remove: (id) => request('DELETE', `/api/meetings/${id}`),
};

const email = {
  /**
   * Send real meeting invitations via the backend.
   * Pass the same meeting object your frontend already uses.
   */
  sendInvitations: (meeting) =>
    request('POST', '/api/email/invite', { meeting }),

  /** Send reminder emails */
  sendReminder: (meeting) =>
    request('POST', '/api/email/reminder', { meeting }),

  /** Test your email config */
  test: (to) =>
    request('POST', '/api/email/test', { to }),
};

const transcription = {
  /**
   * Upload an audio Blob/File for transcription.
   * Returns { transcript, provider, duration, words, segments }
   *
   * @param {Blob} audioBlob  — e.g. the blob from MediaRecorder
   * @param {string} fileName — optional filename hint
   */
  upload: async (audioBlob, fileName = 'recording.webm') => {
    const form = new FormData();
    form.append('audio', audioBlob, fileName);
    return request('POST', '/api/transcription/upload', form, true);
  },

  /** Get all past transcripts for current user */
  getAll: () => request('GET', '/api/transcription'),

  /** Get a single transcript by ID */
  get: (id) => request('GET', `/api/transcription/${id}`),
};

const sync = {
  /**
   * Push all local app data to the cloud.
   * Call this after any significant change, or on a timer.
   *
   * @param {object} appState — pull from localStorage / React state
   */
  push: (appState) => request('POST', '/api/sync/push', appState),

  /**
   * Pull cloud data to restore on a new device.
   * Returns { meetingHistory, contacts, groups, reminders, ... }
   */
  pull: () => request('GET', '/api/sync/pull'),

  /** Check when data was last synced */
  status: () => request('GET', '/api/sync/status'),
};

const health = {
  /** Check backend status and which services are configured */
  check: () => request('GET', '/health'),
};

// ─── Attendance ───────────────────────────────────────────────────────────────

const attendance = {
  /** Fetch all attendance records */
  getAll: () => request('GET', '/api/attendance'),

  /** Save (create or update) an attendance record */
  save: (record) => request('POST', '/api/attendance', record),

  /** Delete an attendance record by id */
  remove: (id) => request('DELETE', `/api/attendance/${id}`),
};

// ─── Staff Directory ──────────────────────────────────────────────────────────

const directory = {
  /** Fetch all directory records */
  getAll: () => request('GET', '/api/directory'),

  /** Save (create or update) a staff record */
  save: (record) => request('POST', '/api/directory', record),

  /** Delete a staff record by id */
  remove: (id) => request('DELETE', `/api/directory/${id}`),
};

// ─── Contacts & Groups ────────────────────────────────────────────────────────

const contacts = {
  /**
   * Fetch contacts + groups in one call.
   * Returns { contacts: Contact[], groups: Group[] }
   */
  getAll: () => request('GET', '/api/contacts'),

  /**
   * Save the full contacts + groups list.
   * @param {{ contacts: Contact[], groups: Group[] }} payload
   */
  save: (payload) => request('PUT', '/api/contacts', payload),
};

// ─── Notices ──────────────────────────────────────────────────────────────────

const notices = {
  /** Fetch all board notices */
  getAll: () => request('GET', '/api/notices'),

  /** Post a new notice */
  create: (notice) => request('POST', '/api/notices', notice),

  /** Delete a notice by id */
  remove: (id) => request('DELETE', `/api/notices/${id}`),
};

// ─── Faculty Mail ─────────────────────────────────────────────────────────────

const mail = {
  /** Fetch inbox for authenticated user */
  inbox: () => request('GET', '/api/mail/inbox'),

  /** Fetch sent items */
  sent: () => request('GET', '/api/mail/sent'),

  /**
   * Send a new message.
   * @param {{ to: string, subject: string, body: string }} msg
   */
  send: (msg) => request('POST', '/api/mail/send', msg),

  /**
   * Reply to an existing thread.
   * @param {{ threadId: string, body: string }} reply
   */
  reply: (reply) => request('POST', '/api/mail/reply', reply),

  /** Mark a message as read */
  markRead: (id) => request('PUT', `/api/mail/${id}/read`),

  /** Delete a message */
  remove: (id) => request('DELETE', `/api/mail/${id}`),
};

// ─── Cloud Drive ──────────────────────────────────────────────────────────────

const drive = {
  /**
   * List files for the authenticated user.
   * Tip: you can also use window.puter.fs.readdir('.') since Puter is
   * already loaded in your index.html.
   */
  list: () => request('GET', '/api/drive'),

  /**
   * Upload a file.
   * @param {File} file — browser File object
   */
  upload: async (file) => {
    const form = new FormData();
    form.append('file', file, file.name);
    return request('POST', '/api/drive', form, true);
  },

  /** Delete a file by id */
  remove: (id) => request('DELETE', `/api/drive/${id}`),
};

// ─── Reminders ────────────────────────────────────────────────────────────────

const reminders = {
  /** Fetch all reminders (server-persisted, survives browser clear) */
  getAll: () => request('GET', '/api/reminders'),

  /**
   * Register a reminder — server will push-notify the user even when
   * the tab is closed.
   * @param {{ title: string, datetime: string, meetingId: string, notifyBefore: number }} reminder
   */
  push: (reminder) => request('POST', '/api/reminders', reminder),

  /** Delete a reminder by id */
  remove: (id) => request('DELETE', `/api/reminders/${id}`),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

const settings = {
  /**
   * Fetch institution settings (applies across all boardroom terminals).
   * Returns { institutionName, darkMode, clock24, notifs, autolock, sounds }
   */
  get: () => request('GET', '/api/settings'),

  /**
   * Persist all settings to the server.
   * @param {{ institutionName: string, darkMode: boolean, clock24: boolean, notifs: boolean, autolock: boolean, sounds: boolean }} s
   */
  save: (s) => request('PUT', '/api/settings', s),
};

// ─────────────────────────────────────────────────────────────────────────────

const api = {
  // Auth
  auth,
  // High value
  meetings,
  attendance,
  directory,
  contacts,
  // Medium value
  notices,
  mail,
  drive,
  // Low value
  reminders,
  settings,
  // Existing
  email,
  transcription,
  sync,
  health,
};
export default api;