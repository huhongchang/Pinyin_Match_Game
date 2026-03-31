import { listEventsByRange } from './analytics-store.mjs';

function corsHeaders(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    Vary: 'Origin'
  };
}

function json(statusCode, body, event) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(event)
    },
    body: JSON.stringify(body)
  };
}

function parseRange(query = {}) {
  const now = Date.now();
  const defaultStart = now - 7 * 24 * 60 * 60 * 1000;

  const startAt = Number.parseInt(String(query.startAt ?? defaultStart), 10);
  const endAt = Number.parseInt(String(query.endAt ?? now), 10);

  if (Number.isNaN(startAt) || Number.isNaN(endAt)) {
    return {
      startAt: defaultStart,
      endAt: now
    };
  }

  const start = Math.min(startAt, endAt);
  const end = Math.max(startAt, endAt);

  const maxSpan = 93 * 24 * 60 * 60 * 1000;
  if (end - start > maxSpan) {
    return {
      startAt: end - maxSpan,
      endAt: end
    };
  }

  return {
    startAt: start,
    endAt: end
  };
}

function parseLimit(query = {}) {
  const parsed = Number.parseInt(String(query.limit ?? '3000'), 10);
  if (Number.isNaN(parsed)) {
    return 3000;
  }
  return Math.max(100, Math.min(10000, parsed));
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        Allow: 'GET, OPTIONS',
        ...corsHeaders(event)
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { message: 'Method Not Allowed' }, event);
  }

  const query = event.queryStringParameters ?? {};
  const { startAt, endAt } = parseRange(query);
  const limit = parseLimit(query);
  const events = await listEventsByRange(startAt, endAt, limit);

  return json(200, {
    range: { startAt, endAt },
    limit,
    truncated: events.length >= limit,
    count: events.length,
    events
  }, event);
}
