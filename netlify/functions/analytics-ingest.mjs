import { analyticsStore, sanitizeEvent, toUtcDateKey } from './analytics-store.mjs';

function corsHeaders(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        Allow: 'POST, OPTIONS',
        ...corsHeaders(event)
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { message: 'Method Not Allowed' }, event);
  }

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return json(400, { message: 'Invalid JSON body' }, event);
  }

  const sourceEvents = Array.isArray(body?.events) ? body.events : [body?.event ?? body];
  const sanitized = sourceEvents.map((item) => sanitizeEvent(item)).filter(Boolean);

  if (sanitized.length === 0) {
    return json(400, { message: 'No valid events' }, event);
  }

  await Promise.all(
    sanitized.map((item) => {
      const dayKey = toUtcDateKey(item.timestamp);
      const key = `events/${dayKey}/${item.timestamp}-${item.id}.json`;
      return analyticsStore.set(key, JSON.stringify(item));
    })
  );

  return json(200, {
    accepted: sanitized.length,
    receivedAt: Date.now()
  }, event);
}
