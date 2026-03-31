import { isValidGrade, isValidSubject } from '@/domain/game';
const EVENTS_KEY = 'usage_events_v1';
const DEVICE_KEY = 'usage_device_id_v1';
const SESSION_KEY = 'usage_session_v1';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_EVENTS = 6000;
const ANALYTICS_INGEST_API = '/.netlify/functions/analytics-ingest';
const ANALYTICS_REPORT_API = '/.netlify/functions/analytics-report';
const REMOTE_BATCH_SIZE = 20;
let pendingRemoteQueue = [];
let flushTimer = null;
let remoteFlushing = false;
function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
function parsePositiveInt(value) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return undefined;
    }
    return parsed;
}
function parseFloatNumber(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return undefined;
    }
    return parsed;
}
function normalizeRemoteEvent(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }
    const raw = item;
    if (typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.sessionId !== 'string' || typeof raw.deviceId !== 'string') {
        return null;
    }
    const timestamp = parsePositiveInt(raw.timestamp);
    if (!timestamp) {
        return null;
    }
    const event = {
        id: raw.id,
        name: raw.name,
        timestamp,
        sessionId: raw.sessionId,
        deviceId: raw.deviceId,
        path: typeof raw.path === 'string' ? raw.path : undefined,
        routeName: typeof raw.routeName === 'string' ? raw.routeName : undefined,
        pageName: typeof raw.pageName === 'string' ? raw.pageName : undefined,
        subjectId: typeof raw.subjectId === 'string' && isValidSubject(raw.subjectId) ? raw.subjectId : undefined,
        gradeId: typeof raw.gradeId === 'string' && isValidGrade(raw.gradeId) ? raw.gradeId : undefined,
        unit: parsePositiveInt(raw.unit),
        level: parsePositiveInt(raw.level),
        duration: parsePositiveInt(raw.duration),
        errorCount: parseFloatNumber(raw.errorCount)
    };
    return event;
}
function parseEvents(raw) {
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter((item) => Boolean(item) && typeof item === 'object' && 'name' in item)
            .sort((a, b) => a.timestamp - b.timestamp);
    }
    catch {
        return [];
    }
}
function saveEvents(events) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}
async function flushRemoteQueue() {
    if (remoteFlushing || pendingRemoteQueue.length === 0) {
        return;
    }
    remoteFlushing = true;
    try {
        while (pendingRemoteQueue.length > 0) {
            const batch = pendingRemoteQueue.slice(0, REMOTE_BATCH_SIZE);
            const response = await fetch(ANALYTICS_INGEST_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ events: batch }),
                keepalive: true
            });
            if (!response.ok) {
                break;
            }
            pendingRemoteQueue = pendingRemoteQueue.slice(batch.length);
        }
    }
    catch {
        // network errors are tolerated, queue keeps pending
    }
    finally {
        remoteFlushing = false;
    }
}
function scheduleRemoteFlush() {
    if (pendingRemoteQueue.length === 0) {
        return;
    }
    if (pendingRemoteQueue.length >= REMOTE_BATCH_SIZE) {
        void flushRemoteQueue();
        return;
    }
    if (flushTimer !== null) {
        return;
    }
    flushTimer = window.setTimeout(() => {
        flushTimer = null;
        void flushRemoteQueue();
    }, 1000);
}
function enqueueRemoteEvent(event) {
    pendingRemoteQueue.push(event);
    if (pendingRemoteQueue.length > 2000) {
        pendingRemoteQueue = pendingRemoteQueue.slice(-1000);
    }
    scheduleRemoteFlush();
}
function normalizeContext(payload) {
    const context = { ...payload };
    if (typeof context.subjectId === 'string' && !isValidSubject(context.subjectId)) {
        delete context.subjectId;
    }
    if (typeof context.gradeId === 'string' && !isValidGrade(context.gradeId)) {
        delete context.gradeId;
    }
    if (typeof context.unit === 'number' && (!Number.isInteger(context.unit) || context.unit <= 0)) {
        delete context.unit;
    }
    if (typeof context.level === 'number' && (!Number.isInteger(context.level) || context.level <= 0)) {
        delete context.level;
    }
    return context;
}
function getDeviceId() {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) {
        return existing;
    }
    const id = createId();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
}
function getSessionId(now) {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.id && typeof parsed.lastActiveAt === 'number' && now - parsed.lastActiveAt <= SESSION_TIMEOUT_MS) {
                localStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, lastActiveAt: now }));
                return parsed.id;
            }
        }
        catch {
            // ignore parse errors
        }
    }
    const nextId = createId();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: nextId, lastActiveAt: now }));
    return nextId;
}
function parseContextFromPath(path) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) {
        return { pageName: 'home' };
    }
    const section = segments[0];
    if (section === 'grade') {
        return {
            pageName: 'grade',
            subjectId: segments[1]
        };
    }
    if (section === 'unit') {
        return {
            pageName: 'unit',
            subjectId: segments[1],
            gradeId: segments[2]
        };
    }
    if (section === 'level') {
        return {
            pageName: 'level',
            subjectId: segments[1],
            gradeId: segments[2],
            unit: Number.parseInt(segments[3] ?? '', 10)
        };
    }
    if (section === 'game') {
        return {
            pageName: 'game',
            subjectId: segments[1],
            gradeId: segments[2],
            unit: Number.parseInt(segments[3] ?? '', 10),
            level: Number.parseInt(segments[4] ?? '', 10)
        };
    }
    if (section === 'victory') {
        return {
            pageName: 'victory',
            subjectId: segments[1],
            gradeId: segments[2],
            unit: Number.parseInt(segments[3] ?? '', 10),
            level: Number.parseInt(segments[4] ?? '', 10)
        };
    }
    return {
        pageName: section
    };
}
export function trackEvent(name, payload = {}) {
    const now = Date.now();
    const context = normalizeContext(payload);
    const event = {
        id: createId(),
        name,
        timestamp: now,
        sessionId: getSessionId(now),
        deviceId: getDeviceId(),
        path: context.path,
        routeName: context.routeName,
        pageName: context.pageName,
        subjectId: context.subjectId,
        gradeId: context.gradeId,
        unit: context.unit,
        level: context.level,
        duration: context.duration,
        errorCount: context.errorCount
    };
    const events = getAnalyticsEvents();
    events.push(event);
    saveEvents(events);
    enqueueRemoteEvent(event);
}
export function trackPageView(path, routeName, payload = {}) {
    const pathContext = parseContextFromPath(path);
    trackEvent('page_view', {
        ...pathContext,
        ...payload,
        path,
        routeName
    });
}
export function getAnalyticsEvents() {
    return parseEvents(localStorage.getItem(EVENTS_KEY));
}
export async function fetchRemoteAnalyticsEvents(range) {
    const params = new URLSearchParams({
        startAt: String(range.startAt),
        endAt: String(range.endAt)
    });
    const response = await fetch(`${ANALYTICS_REPORT_API}?${params.toString()}`, {
        method: 'GET',
        headers: {
            Accept: 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`Fetch analytics failed: ${response.status}`);
    }
    const data = (await response.json());
    const source = Array.isArray(data.events) ? data.events : [];
    return source
        .map((item) => normalizeRemoteEvent(item))
        .filter((event) => event !== null)
        .sort((a, b) => a.timestamp - b.timestamp);
}
export function escapeCsvValue(value) {
    if (/[,"\n]/.test(value)) {
        return `"${value.replaceAll('"', '""')}"`;
    }
    return value;
}
export function exportEventsAsCsv(events) {
    const header = [
        'timestamp',
        'event',
        'sessionId',
        'deviceId',
        'path',
        'subjectId',
        'gradeId',
        'unit',
        'level',
        'duration',
        'errorCount'
    ];
    const rows = events.map((event) => [
        new Date(event.timestamp).toISOString(),
        event.name,
        event.sessionId,
        event.deviceId,
        event.path ?? '',
        event.subjectId ?? '',
        event.gradeId ?? '',
        event.unit?.toString() ?? '',
        event.level?.toString() ?? '',
        event.duration?.toString() ?? '',
        event.errorCount?.toString() ?? ''
    ]);
    return [header, ...rows].map((row) => row.map((cell) => escapeCsvValue(cell)).join(',')).join('\n');
}
