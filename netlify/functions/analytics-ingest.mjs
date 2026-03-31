import { analyticsStore, sanitizeEvent, toUtcDateKey } from './analytics-store.mjs';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        Allow: 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { message: 'Method Not Allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return json(400, { message: 'Invalid JSON body' });
  }

  const sourceEvents = Array.isArray(body?.events) ? body.events : [body?.event ?? body];
  const sanitized = sourceEvents.map((item) => sanitizeEvent(item)).filter(Boolean);

  if (sanitized.length === 0) {
    return json(400, { message: 'No valid events' });
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
  });
}
