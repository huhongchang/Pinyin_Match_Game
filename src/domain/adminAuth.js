const ADMIN_SESSION_KEY = 'admin_session_v1';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'admin123';
function createToken() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function parseSession(raw) {
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed.token || !parsed.username || typeof parsed.expiresAt !== 'number') {
            return null;
        }
        return {
            token: parsed.token,
            username: parsed.username,
            expiresAt: parsed.expiresAt
        };
    }
    catch {
        return null;
    }
}
function saveSession(session) {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}
export function loginAdmin(username, password) {
    const normalizedUsername = username.trim();
    if (normalizedUsername !== DEFAULT_ADMIN_USERNAME || password !== DEFAULT_ADMIN_PASSWORD) {
        return false;
    }
    saveSession({
        token: createToken(),
        username: normalizedUsername,
        expiresAt: Date.now() + SESSION_DURATION_MS
    });
    return true;
}
export function getAdminSession() {
    const session = parseSession(localStorage.getItem(ADMIN_SESSION_KEY));
    if (!session) {
        return null;
    }
    if (session.expiresAt <= Date.now()) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        return null;
    }
    return session;
}
export function isAdminLoggedIn() {
    return getAdminSession() !== null;
}
export function logoutAdmin() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
}
