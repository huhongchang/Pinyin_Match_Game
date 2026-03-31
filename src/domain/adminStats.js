import { SUBJECT_META } from '@/data/books';
function getDayStart(ts) {
    const date = new Date(ts);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}
function getDayEnd(ts) {
    const date = new Date(ts);
    date.setHours(23, 59, 59, 999);
    return date.getTime();
}
export function resolveDateRange(preset, customStart = '', customEnd = '') {
    const now = Date.now();
    if (preset === 'today') {
        return {
            startAt: getDayStart(now),
            endAt: now
        };
    }
    if (preset === '7d' || preset === '30d') {
        const days = preset === '7d' ? 7 : 30;
        const start = getDayStart(now - (days - 1) * 24 * 60 * 60 * 1000);
        return {
            startAt: start,
            endAt: now
        };
    }
    const fallbackStart = getDayStart(now - 6 * 24 * 60 * 60 * 1000);
    const fallbackEnd = now;
    if (!customStart || !customEnd) {
        return {
            startAt: fallbackStart,
            endAt: fallbackEnd
        };
    }
    const start = new Date(`${customStart}T00:00:00`).getTime();
    const end = new Date(`${customEnd}T23:59:59`).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) {
        return {
            startAt: fallbackStart,
            endAt: fallbackEnd
        };
    }
    return {
        startAt: Math.min(start, end),
        endAt: Math.max(start, end)
    };
}
function avg(values) {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function buildSessionMap(events) {
    const map = new Map();
    for (const event of events) {
        if (!map.has(event.sessionId)) {
            map.set(event.sessionId, []);
        }
        map.get(event.sessionId).push(event);
    }
    for (const list of map.values()) {
        list.sort((a, b) => a.timestamp - b.timestamp);
    }
    return map;
}
function matchDimensionFilters(event, filters) {
    if (filters.subjectId && event.subjectId !== filters.subjectId) {
        return false;
    }
    if (filters.gradeId && event.gradeId !== filters.gradeId) {
        return false;
    }
    if (typeof filters.unit === 'number' && event.unit !== filters.unit) {
        return false;
    }
    if (typeof filters.level === 'number' && event.level !== filters.level) {
        return false;
    }
    return true;
}
function toPageStats(counter) {
    return Array.from(counter.entries())
        .map(([path, info]) => ({ path, pv: info.pv, uv: info.uv.size }))
        .sort((a, b) => b.pv - a.pv);
}
function countByPath(events) {
    const counter = new Map();
    for (const event of events) {
        if (event.name !== 'page_view') {
            continue;
        }
        const path = event.path ?? 'unknown';
        if (!counter.has(path)) {
            counter.set(path, { pv: 0, uv: new Set() });
        }
        const item = counter.get(path);
        item.pv += 1;
        item.uv.add(event.deviceId);
    }
    return toPageStats(counter);
}
function countEntryOrExitPages(sessionMap, type) {
    const counter = new Map();
    for (const events of sessionMap.values()) {
        const pageViews = events.filter((event) => event.name === 'page_view');
        if (pageViews.length === 0) {
            continue;
        }
        const chosen = type === 'entry' ? pageViews[0] : pageViews[pageViews.length - 1];
        const path = chosen.path ?? 'unknown';
        if (!counter.has(path)) {
            counter.set(path, { pv: 0, uv: new Set() });
        }
        const item = counter.get(path);
        item.pv += 1;
        item.uv.add(chosen.deviceId);
    }
    return toPageStats(counter);
}
function buildFunnel(sessionMap) {
    const checks = [
        {
            key: 'home',
            label: '首页曝光',
            test: (event) => event.name === 'page_view' && event.path === '/'
        },
        {
            key: 'subject',
            label: '进入学科页',
            test: (event) => event.name === 'subject_enter' || (event.name === 'page_view' && (event.path ?? '').startsWith('/grade/'))
        },
        {
            key: 'unit',
            label: '进入单元',
            test: (event) => event.name === 'unit_enter' || (event.name === 'page_view' && (event.path ?? '').startsWith('/unit/'))
        },
        {
            key: 'level',
            label: '进入关卡页',
            test: (event) => event.name === 'level_enter' || (event.name === 'page_view' && (event.path ?? '').startsWith('/level/'))
        },
        {
            key: 'game',
            label: '开始游戏',
            test: (event) => event.name === 'game_start' || (event.name === 'page_view' && (event.path ?? '').startsWith('/game/'))
        },
        {
            key: 'complete',
            label: '完成通关',
            test: (event) => event.name === 'game_complete' || (event.name === 'page_view' && (event.path ?? '').startsWith('/victory/'))
        }
    ];
    const counts = checks.map(({ test }) => {
        let sessions = 0;
        for (const events of sessionMap.values()) {
            if (events.some(test)) {
                sessions += 1;
            }
        }
        return sessions;
    });
    return checks.map((stage, index) => {
        const current = counts[index];
        const previous = index > 0 ? counts[index - 1] : current;
        const conversionRate = previous > 0 ? current / previous : 0;
        return {
            key: stage.key,
            label: stage.label,
            sessions: current,
            conversionRate,
            lossRate: index > 0 ? 1 - conversionRate : 0
        };
    });
}
function buildLearningRows(events) {
    const buckets = new Map();
    for (const event of events) {
        const { subjectId, gradeId, unit, level } = event;
        if (!subjectId || !gradeId || !unit || !level) {
            continue;
        }
        const key = `${subjectId}|${gradeId}|${unit}|${level}`;
        if (!buckets.has(key)) {
            buckets.set(key, {
                subjectId,
                gradeId,
                unit,
                level,
                starts: 0,
                completions: 0,
                durations: [],
                errors: []
            });
        }
        const item = buckets.get(key);
        if (event.name === 'game_start') {
            item.starts += 1;
        }
        if (event.name === 'game_complete') {
            item.completions += 1;
            if (typeof event.duration === 'number') {
                item.durations.push(event.duration);
            }
            if (typeof event.errorCount === 'number') {
                item.errors.push(event.errorCount);
            }
        }
    }
    return Array.from(buckets.entries())
        .map(([key, item]) => ({
        key,
        subjectId: item.subjectId,
        gradeId: item.gradeId,
        unit: item.unit,
        level: item.level,
        starts: item.starts,
        completions: item.completions,
        completionRate: item.starts > 0 ? item.completions / item.starts : 0,
        avgDuration: avg(item.durations),
        avgErrors: avg(item.errors)
    }))
        .sort((a, b) => b.starts - a.starts)
        .slice(0, 20);
}
function buildDailyTrend(events, range) {
    const dayMap = new Map();
    for (let cursor = getDayStart(range.startAt); cursor <= range.endAt; cursor += 24 * 60 * 60 * 1000) {
        const dateKey = new Date(cursor).toISOString().slice(0, 10);
        dayMap.set(dateKey, { devices: new Set(), starts: 0, completes: 0 });
    }
    for (const event of events) {
        const dateKey = new Date(getDayStart(event.timestamp)).toISOString().slice(0, 10);
        if (!dayMap.has(dateKey)) {
            continue;
        }
        const bucket = dayMap.get(dateKey);
        bucket.devices.add(event.deviceId);
        if (event.name === 'game_start') {
            bucket.starts += 1;
        }
        if (event.name === 'game_complete') {
            bucket.completes += 1;
        }
    }
    return Array.from(dayMap.entries()).map(([date, bucket]) => ({
        date,
        activeDevices: bucket.devices.size,
        gameStarts: bucket.starts,
        gameCompletions: bucket.completes
    }));
}
export function createDashboardReport(allEvents, range, filters) {
    const rangedEvents = allEvents.filter((event) => event.timestamp >= range.startAt && event.timestamp <= range.endAt);
    const filteredEvents = rangedEvents.filter((event) => matchDimensionFilters(event, filters));
    const sessionMap = buildSessionMap(filteredEvents);
    const gameStarts = filteredEvents.filter((event) => event.name === 'game_start');
    const gameCompletes = filteredEvents.filter((event) => event.name === 'game_complete');
    const sessionDurations = Array.from(sessionMap.values()).map((events) => {
        if (events.length <= 1) {
            return 0;
        }
        return (events[events.length - 1].timestamp - events[0].timestamp) / 1000;
    });
    const sessionsWithPageView = Array.from(sessionMap.values()).filter((events) => events.some((event) => event.name === 'page_view'));
    const bounceSessions = sessionsWithPageView.filter((events) => events.filter((event) => event.name === 'page_view').length <= 1).length;
    const summary = {
        activeDevices: new Set(filteredEvents.map((event) => event.deviceId)).size,
        sessions: sessionMap.size,
        gameStarts: gameStarts.length,
        gameCompletions: gameCompletes.length,
        avgSessionSeconds: avg(sessionDurations),
        avgCompletionSeconds: avg(gameCompletes.map((event) => event.duration ?? 0)),
        avgErrorCount: avg(gameCompletes.map((event) => event.errorCount ?? 0)),
        bounceRate: sessionsWithPageView.length > 0 ? bounceSessions / sessionsWithPageView.length : 0
    };
    const subjectStats = SUBJECT_META.map((subject) => ({
        subjectId: subject.id,
        subjectName: subject.name,
        starts: gameStarts.filter((event) => event.subjectId === subject.id).length,
        completions: gameCompletes.filter((event) => event.subjectId === subject.id).length
    }));
    return {
        range,
        totalEvents: rangedEvents.length,
        filteredEvents,
        summary,
        subjectStats,
        pageStats: countByPath(filteredEvents),
        entryPages: countEntryOrExitPages(sessionMap, 'entry'),
        exitPages: countEntryOrExitPages(sessionMap, 'exit'),
        funnel: buildFunnel(sessionMap),
        learningRows: buildLearningRows(filteredEvents),
        dailyTrend: buildDailyTrend(filteredEvents, range)
    };
}
