import { isValidGrade, isValidSubject } from '@/domain/game';
import type { GradeId, SubjectId } from '@/types';

const EVENTS_KEY = 'usage_events_v1';
const DEVICE_KEY = 'usage_device_id_v1';
const SESSION_KEY = 'usage_session_v1';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_EVENTS = 6000;
const ANALYTICS_INGEST_FUNCTION_PATH = '/.netlify/functions/analytics-ingest';
const ANALYTICS_REPORT_FUNCTION_PATH = '/.netlify/functions/analytics-report';
const DEV_DEFAULT_ANALYTICS_ORIGIN = 'https://hhc-subjectmatchgame.netlify.app';
const REMOTE_BATCH_SIZE = 20;
const REMOTE_REQUEST_TIMEOUT_MS = 7000;
const REPORT_FETCH_LIMIT = 3000;

let pendingRemoteQueue: AnalyticsEvent[] = [];
let flushTimer: number | null = null;
let remoteFlushing = false;

export type AnalyticsEventName =
  | 'page_view'
  | 'subject_enter'
  | 'unit_enter'
  | 'level_enter'
  | 'game_start'
  | 'game_match_success'
  | 'game_match_fail'
  | 'game_hint_use'
  | 'game_complete'
  | 'page_leave';

export interface AnalyticsEvent {
  id: string;
  name: AnalyticsEventName;
  timestamp: number;
  sessionId: string;
  deviceId: string;
  path?: string;
  routeName?: string;
  pageName?: string;
  subjectId?: SubjectId;
  gradeId?: GradeId;
  unit?: number;
  level?: number;
  duration?: number;
  errorCount?: number;
}

export interface AnalyticsEventPayload {
  path?: string;
  routeName?: string;
  pageName?: string;
  subjectId?: string;
  gradeId?: string;
  unit?: number;
  level?: number;
  duration?: number;
  errorCount?: number;
}

export interface AnalyticsFetchRange {
  startAt: number;
  endAt: number;
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function parsePositiveInt(value: unknown): number | undefined {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function parseFloatNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
}

function normalizeRemoteEvent(item: unknown): AnalyticsEvent | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const raw = item as Partial<AnalyticsEvent>;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string' || typeof raw.sessionId !== 'string' || typeof raw.deviceId !== 'string') {
    return null;
  }

  const timestamp = parsePositiveInt(raw.timestamp);
  if (!timestamp) {
    return null;
  }

  const event: AnalyticsEvent = {
    id: raw.id,
    name: raw.name as AnalyticsEventName,
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

function parseEvents(raw: string | null): AnalyticsEvent[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is AnalyticsEvent => Boolean(item) && typeof item === 'object' && 'name' in item)
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}

function saveEvents(events: AnalyticsEvent[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function resolveRemoteAnalyticsOrigin(): string | null {
  const configured = String(import.meta.env.VITE_ANALYTICS_REMOTE_ORIGIN ?? '').trim();
  if (configured) {
    return normalizeOrigin(configured);
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const currentOrigin = window.location.origin;
  const isLocalRuntime = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
  if (isLocalRuntime) {
    return DEV_DEFAULT_ANALYTICS_ORIGIN;
  }

  return null;
}

function buildApiCandidates(functionPath: string): string[] {
  const candidates: string[] = [functionPath];
  const remoteOrigin = resolveRemoteAnalyticsOrigin();

  if (remoteOrigin && (typeof window === 'undefined' || normalizeOrigin(window.location.origin) !== remoteOrigin)) {
    candidates.push(`${remoteOrigin}${functionPath}`);
  }

  return Array.from(new Set(candidates));
}

async function parseJsonResponse<T>(response: Response, endpoint: string): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const bodyText = await response.text();

  if (!contentType.includes('application/json')) {
    const snippet = bodyText.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(`Non-JSON response @ ${endpoint} (${contentType || 'unknown'}): ${snippet}`);
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error(`Invalid JSON response @ ${endpoint}`);
  }
}

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort();
  }, REMOTE_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timer);
  }
}

async function postEventsBatch(batch: AnalyticsEvent[]): Promise<boolean> {
  const endpoints = buildApiCandidates(ANALYTICS_INGEST_FUNCTION_PATH);

  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ events: batch }),
        keepalive: true
      });

      if (response.ok) {
        return true;
      }
    } catch {
      // try next endpoint
    }
  }

  return false;
}

async function flushRemoteQueue(): Promise<void> {
  if (remoteFlushing || pendingRemoteQueue.length === 0) {
    return;
  }

  remoteFlushing = true;

  try {
    while (pendingRemoteQueue.length > 0) {
      const batch = pendingRemoteQueue.slice(0, REMOTE_BATCH_SIZE);
      const posted = await postEventsBatch(batch);

      if (!posted) {
        break;
      }

      pendingRemoteQueue = pendingRemoteQueue.slice(batch.length);
    }
  } catch {
    // network errors are tolerated, queue keeps pending
  } finally {
    remoteFlushing = false;
  }
}

function scheduleRemoteFlush(): void {
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

function enqueueRemoteEvent(event: AnalyticsEvent): void {
  pendingRemoteQueue.push(event);

  if (pendingRemoteQueue.length > 2000) {
    pendingRemoteQueue = pendingRemoteQueue.slice(-1000);
  }

  scheduleRemoteFlush();
}

function normalizeContext(payload: AnalyticsEventPayload): AnalyticsEventPayload {
  const context: AnalyticsEventPayload = { ...payload };

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

function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) {
    return existing;
  }

  const id = createId();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

function getSessionId(now: number): string {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { id?: string; lastActiveAt?: number };
      if (parsed.id && typeof parsed.lastActiveAt === 'number' && now - parsed.lastActiveAt <= SESSION_TIMEOUT_MS) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, lastActiveAt: now }));
        return parsed.id;
      }
    } catch {
      // ignore parse errors
    }
  }

  const nextId = createId();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: nextId, lastActiveAt: now }));
  return nextId;
}

function parseContextFromPath(path: string): AnalyticsEventPayload {
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

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsEventPayload = {}): void {
  const now = Date.now();
  const context = normalizeContext(payload);

  const event: AnalyticsEvent = {
    id: createId(),
    name,
    timestamp: now,
    sessionId: getSessionId(now),
    deviceId: getDeviceId(),
    path: context.path,
    routeName: context.routeName,
    pageName: context.pageName,
    subjectId: context.subjectId as SubjectId | undefined,
    gradeId: context.gradeId as GradeId | undefined,
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

export function trackPageView(path: string, routeName?: string, payload: AnalyticsEventPayload = {}): void {
  const pathContext = parseContextFromPath(path);
  trackEvent('page_view', {
    ...pathContext,
    ...payload,
    path,
    routeName
  });
}

export function getAnalyticsEvents(): AnalyticsEvent[] {
  return parseEvents(localStorage.getItem(EVENTS_KEY));
}

export async function fetchRemoteAnalyticsEvents(range: AnalyticsFetchRange): Promise<AnalyticsEvent[]> {
  const params = new URLSearchParams({
    startAt: String(range.startAt),
    endAt: String(range.endAt),
    limit: String(REPORT_FETCH_LIMIT)
  });

  const endpoints = buildApiCandidates(ANALYTICS_REPORT_FUNCTION_PATH);
  let latestError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        latestError = new Error(`Fetch analytics failed: ${response.status} @ ${endpoint}`);
        continue;
      }

      const data = await parseJsonResponse<{ events?: unknown[] }>(response, endpoint);
      const source = Array.isArray(data.events) ? data.events : [];

      return source
        .map((item) => normalizeRemoteEvent(item))
        .filter((event): event is AnalyticsEvent => event !== null)
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      latestError = error;
    }
  }

  throw latestError instanceof Error ? latestError : new Error('Fetch analytics failed: all endpoints unavailable');
}

export function escapeCsvValue(value: string): string {
  if (/[,"\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function exportEventsAsCsv(events: AnalyticsEvent[]): string {
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
