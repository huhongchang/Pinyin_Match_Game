import { GRADE_META } from '@/data/books';
import { calcStars, getGradeUnits, getUnitLevelCount, isValidGrade, isValidSubject } from '@/domain/game';
export const STORAGE_KEY = 'game_progress';
export const PROGRESS_VERSION = '5.0';
export function getScopeKey(subjectId, gradeId) {
    return `${subjectId}:${gradeId}`;
}
function normalizeScopeKey(rawKey) {
    if (rawKey.includes(':')) {
        const [rawSubject, rawGrade] = rawKey.split(':');
        if (isValidSubject(rawSubject) && isValidGrade(rawGrade)) {
            return getScopeKey(rawSubject, rawGrade);
        }
        return null;
    }
    if (isValidGrade(rawKey)) {
        return getScopeKey('chinese', rawKey);
    }
    return null;
}
export function getLevelKey(unit, level) {
    return `${unit}-${level}`;
}
export function createDefaultProgress() {
    return {
        version: PROGRESS_VERSION,
        currentSubject: 'chinese',
        currentGrade: '一年级上册',
        currentUnit: 1,
        currentLevel: 1,
        unlockedLevels: {},
        levelStats: {},
        settings: {
            sound: true
        }
    };
}
function migrateProgress(raw) {
    const fallback = createDefaultProgress();
    if (!raw || typeof raw !== 'object') {
        return fallback;
    }
    const data = raw;
    const merged = {
        ...fallback,
        ...data,
        currentSubject: typeof data.currentSubject === 'string' && isValidSubject(data.currentSubject)
            ? data.currentSubject
            : fallback.currentSubject,
        currentGrade: typeof data.currentGrade === 'string' && isValidGrade(data.currentGrade)
            ? data.currentGrade
            : fallback.currentGrade,
        unlockedLevels: {},
        levelStats: {},
        settings: {
            sound: true,
            ...(typeof data.settings === 'object' && data.settings ? data.settings : {})
        }
    };
    if (data.unlockedLevels && typeof data.unlockedLevels === 'object' && !Array.isArray(data.unlockedLevels)) {
        const rawUnlocked = data.unlockedLevels;
        const nextUnlocked = {};
        for (const [rawKey, value] of Object.entries(rawUnlocked)) {
            const scope = normalizeScopeKey(rawKey);
            if (!scope || !Array.isArray(value)) {
                continue;
            }
            nextUnlocked[scope] = value.filter((x) => typeof x === 'string');
        }
        merged.unlockedLevels = nextUnlocked;
    }
    if (Array.isArray(data.unlockedLevels)) {
        const arr = data.unlockedLevels;
        const scope = getScopeKey('chinese', merged.currentGrade);
        merged.unlockedLevels[scope] = arr
            .map((x) => Number(x))
            .filter((x) => Number.isInteger(x) && x > 0)
            .map((x) => getLevelKey(1, x));
    }
    if (data.levelStats && typeof data.levelStats === 'object' && !Array.isArray(data.levelStats)) {
        const rawStats = data.levelStats;
        const nextStats = {};
        for (const [rawKey, value] of Object.entries(rawStats)) {
            const scope = normalizeScopeKey(rawKey);
            if (!scope || !value || typeof value !== 'object' || Array.isArray(value)) {
                continue;
            }
            nextStats[scope] = value;
        }
        merged.levelStats = nextStats;
    }
    merged.version = PROGRESS_VERSION;
    return merged;
}
export function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return createDefaultProgress();
        }
        const parsed = JSON.parse(raw);
        const migrated = migrateProgress(parsed);
        saveProgress(migrated);
        return migrated;
    }
    catch (error) {
        console.warn('读取进度失败，使用默认进度。', error);
        return createDefaultProgress();
    }
}
export function saveProgress(progress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, version: PROGRESS_VERSION }));
    }
    catch (error) {
        console.warn('保存进度失败。', error);
    }
}
export function getLevelStat(progress, subjectId, gradeId, unit, level) {
    const key = getLevelKey(unit, level);
    const scope = getScopeKey(subjectId, gradeId);
    return progress.levelStats[scope]?.[key] ?? null;
}
export function updateBestStat(progress, subjectId, gradeId, unit, level, errors, time) {
    const stars = calcStars(errors);
    const key = getLevelKey(unit, level);
    const scope = getScopeKey(subjectId, gradeId);
    if (!progress.levelStats[scope]) {
        progress.levelStats[scope] = {};
    }
    const old = progress.levelStats[scope]?.[key];
    if (!old || stars > old.stars || (stars === old.stars && time < old.time)) {
        progress.levelStats[scope][key] = { errors, time, stars };
    }
}
export function isLevelCompleted(progress, subjectId, gradeId, unit, level) {
    const key = getLevelKey(unit, level);
    const scope = getScopeKey(subjectId, gradeId);
    const done = progress.unlockedLevels[scope] ?? [];
    return done.includes(key);
}
export function markLevelCompleted(progress, subjectId, gradeId, unit, level) {
    const key = getLevelKey(unit, level);
    const scope = getScopeKey(subjectId, gradeId);
    if (!progress.unlockedLevels[scope]) {
        progress.unlockedLevels[scope] = [];
    }
    const list = progress.unlockedLevels[scope];
    if (!list.includes(key)) {
        list.push(key);
    }
}
function getPreviousLevel(subjectId, gradeId, unit, level) {
    if (unit === 1 && level === 1) {
        return null;
    }
    if (level > 1) {
        return { unit, level: level - 1 };
    }
    let u = unit - 1;
    while (u >= 1) {
        const levels = getUnitLevelCount(subjectId, gradeId, u);
        if (levels > 0) {
            return { unit: u, level: levels };
        }
        u -= 1;
    }
    return null;
}
export function isLevelUnlocked(progress, subjectId, gradeId, unit, level) {
    const prev = getPreviousLevel(subjectId, gradeId, unit, level);
    if (!prev) {
        return true;
    }
    return isLevelCompleted(progress, subjectId, gradeId, prev.unit, prev.level);
}
export function isUnitCompleted(progress, subjectId, gradeId, unit) {
    const total = getUnitLevelCount(subjectId, gradeId, unit);
    if (total <= 0) {
        return false;
    }
    for (let level = 1; level <= total; level += 1) {
        if (!isLevelCompleted(progress, subjectId, gradeId, unit, level)) {
            return false;
        }
    }
    return true;
}
export function isUnitLocked(progress, subjectId, gradeId, unit) {
    if (unit <= 1) {
        return false;
    }
    return !isUnitCompleted(progress, subjectId, gradeId, unit - 1);
}
export function getCompletedCount(progress, subjectId, gradeId) {
    const scope = getScopeKey(subjectId, gradeId);
    return (progress.unlockedLevels[scope] ?? []).length;
}
export function getSubjectCompletedCount(progress, subjectId) {
    return GRADE_META.reduce((sum, grade) => sum + getCompletedCount(progress, subjectId, grade.id), 0);
}
export function getNextLevel(subjectId, gradeId, unit, level) {
    const unitLevels = getUnitLevelCount(subjectId, gradeId, unit);
    if (level < unitLevels) {
        return { unit, level: level + 1 };
    }
    const totalUnits = getGradeUnits(gradeId);
    for (let u = unit + 1; u <= totalUnits; u += 1) {
        const levels = getUnitLevelCount(subjectId, gradeId, u);
        if (levels > 0) {
            return { unit: u, level: 1 };
        }
    }
    return null;
}
