/**
 * api.js — shared fetch helpers and session management for CampusPulse
 * All pages include this file via <script src="api.js"></script>
 */

const API_BASE = ''; // same origin — server serves the HTML too

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch(method, endpoint, body = null) {
    const opts = {
        method,
        credentials: 'include',           // send session cookie
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + endpoint, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
}

const api = {
    get:    (url)          => apiFetch('GET',    url),
    post:   (url, body)    => apiFetch('POST',   url, body),
    put:    (url, body)    => apiFetch('PUT',    url, body),
    delete: (url)          => apiFetch('DELETE', url)
};

// ─── Session helpers ──────────────────────────────────────────────────────────

/**
 * Fetch current session user from server.
 * Returns the user object or null.
 */
async function getSessionUser() {
    try {
        const data = await api.get('/api/me');
        return data.user || null;
    } catch {
        return null;
    }
}

/**
 * Guard: redirect to index.html if not logged in or wrong role.
 * role: 'student' | 'admin'
 */
async function requireAuth(role) {
    const user = await getSessionUser();
    if (!user || user.role !== role) {
        alert('Please login first!');
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

/**
 * Logout — calls the server then redirects.
 */
async function logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    try {
        await api.post('/api/logout');
    } catch { /* ignore */ }
    window.location.href = 'index.html';
}

/**
 * Admin logout (no confirm dialog).
 */
async function adminLogout() {
    try { await api.post('/api/logout'); } catch { /* ignore */ }
    window.location.href = 'index.html';
}
