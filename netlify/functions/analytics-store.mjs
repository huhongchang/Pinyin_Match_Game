import { getStore } from '@netlify/blobs';

const analyticsSiteID =
  process.env.ANALYTICS_STORE_SITE_ID ?? process.env.NETLIFY_SITE_ID ?? process.env.SITE_ID;
const analyticsToken = process.env.ANALYTICS_STORE_TOKEN;

export const analyticsStore = analyticsSiteID && analyticsToken
  ? getStore({
      name: 'usage-analytics',
      siteID: analyticsSiteID,
      token: analyticsToken
    })
  : getStore('usage-analytics');

export const EVENT_NAME_SET = new Set([
  'page_view',
  'subject_enter',
  'unit_enter',
  'level_enter',
  'game_start',
  'game_match_success',
  'game_match_fail',
  'game_hint_use',
  'game_complete',
  'page_leave'
]);

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function clampString(value, maxLength = 120) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, maxLength);
}

function normalizePositiveInt(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function normalizeTimestamp(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Date.now();
  }
  return Math.floor(parsed);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      const value = await mapper(items[current]);
      results.push(value);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export function toUtcDateKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function sanitizeEvent(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const name = clampString(input.name, 40);
  if (!name || !EVENT_NAME_SET.has(name)) {
    return null;
  }

  const timestamp = normalizeTimestamp(input.timestamp);
  const id = clampString(input.id, 80) ?? createId();

  const event = {
    id,
    name,
    timestamp,
    sessionId: clampString(input.sessionId, 80) ?? createId(),
    deviceId: clampString(input.deviceId, 80) ?? createId(),
    path: clampString(input.path, 200),
    routeName: clampString(input.routeName, 60),
    pageName: clampString(input.pageName, 40),
    subjectId: clampString(input.subjectId, 30),
    gradeId: clampString(input.gradeId, 40),
    unit: normalizePositiveInt(input.unit),
    level: normalizePositiveInt(input.level),
    duration: normalizePositiveInt(input.duration),
    errorCount: Number.isFinite(Number(input.errorCount)) ? Math.max(0, Number(input.errorCount)) : undefined,
    serverReceivedAt: Date.now()
  };

  if (!event.path) {
    delete event.path;
  }
  if (!event.routeName) {
    delete event.routeName;
  }
  if (!event.pageName) {
    delete event.pageName;
  }
  if (!event.subjectId) {
    delete event.subjectId;
  }
  if (!event.gradeId) {
    delete event.gradeId;
  }
  if (!event.unit) {
    delete event.unit;
  }
  if (!event.level) {
    delete event.level;
  }
  if (!event.duration) {
    delete event.duration;
  }
  if (typeof event.errorCount !== 'number') {
    delete event.errorCount;
  }

  return event;
}

export async function listEventsByRange(startAt, endAt, maxEvents = 3000) {
  const results = [];
  const safeLimit = Number.isFinite(Number(maxEvents)) ? Math.max(100, Math.min(10000, Number(maxEvents))) : 3000;

  let cursorDate = new Date(startAt);
  cursorDate.setHours(0, 0, 0, 0);

  const endDate = new Date(endAt);
  endDate.setHours(0, 0, 0, 0);

  while (cursorDate.getTime() <= endDate.getTime()) {
    const dayKey = cursorDate.toISOString().slice(0, 10);
    const prefix = `events/${dayKey}/`;

    let cursor;
    do {
      const page = await analyticsStore.list({ prefix, cursor });
      const blobs = Array.isArray(page?.blobs) ? page.blobs : [];

      const keys = blobs
        .map((blob) => (typeof blob === 'string' ? blob : blob?.key))
        .filter(Boolean);

      const parsedRows = await mapWithConcurrency(keys, 25, async (key) => {
        const content = await analyticsStore.get(key);
        if (!content) {
          return null;
        }

        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            const timestamp = Number(parsed.timestamp);
            if (timestamp >= startAt && timestamp <= endAt) {
              return parsed;
            }
          }
        } catch {
          // ignore invalid blob
        }

        return null;
      });

      for (const row of parsedRows) {
        if (!row) {
          continue;
        }
        results.push(row);
        if (results.length >= safeLimit) {
          break;
        }
      }

      if (results.length >= safeLimit) {
        break;
      }

      cursor = page?.cursor;
    } while (cursor);

    if (results.length >= safeLimit) {
      break;
    }

    cursorDate = new Date(cursorDate.getTime() + 24 * 60 * 60 * 1000);
  }

  results.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  return results;
}
