import { isValidGrade, isValidSubject } from '@/domain/game';
import type { GradeId, SubjectId } from '@/types';

const EVENTS_KEY = 'usage_events_v1';
const DEVICE_KEY = 'usage_device_id_v1';
const SESSION_KEY = 'usage_session_v1';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_EVENTS = 6000;

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

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
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
