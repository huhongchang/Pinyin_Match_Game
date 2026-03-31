import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { trackEvent } from '@/domain/analytics';
import { createTiles, formatMMSS, getGlobalLevelNumber, getLevelWords, getSubjectMeta, getUnitLevelCount, isValidGrade, isValidSubject } from '@/domain/game';
import { isLevelUnlocked } from '@/domain/progress';
import { useProgressStore } from '@/stores/progress';
const route = useRoute();
const router = useRouter();
const progressStore = useProgressStore();
const subjectId = ref(null);
const gradeId = ref(null);
const unit = ref(1);
const level = ref(1);
const tiles = ref([]);
const selectedIndexes = ref([]);
const resolvedCount = ref(0);
const errors = ref(0);
const resolving = ref(false);
const finished = ref(false);
const hintActive = ref(false);
const elapsed = ref(0);
let timer = null;
let startedAt = Date.now();
let audioContext = null;
const totalCards = computed(() => tiles.value.length);
const progressText = computed(() => `${resolvedCount.value}/${totalCards.value}`);
const progressWidth = computed(() => {
    if (totalCards.value === 0) {
        return 0;
    }
    return Math.round((resolvedCount.value / totalCards.value) * 100);
});
const timerText = computed(() => formatMMSS(elapsed.value));
const subjectMeta = computed(() => {
    if (!subjectId.value) {
        return null;
    }
    return getSubjectMeta(subjectId.value);
});
const levelTitle = computed(() => {
    if (!subjectId.value || !gradeId.value) {
        return '第 0 关';
    }
    return `第 ${getGlobalLevelNumber(subjectId.value, gradeId.value, unit.value, level.value)} 关`;
});
const pairLabel = computed(() => {
    if (!subjectMeta.value) {
        return '';
    }
    return `${subjectMeta.value.leftLabel} - ${subjectMeta.value.rightLabel}`;
});
function clearTimer() {
    if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
    }
}
function startTimer() {
    clearTimer();
    startedAt = Date.now();
    elapsed.value = 0;
    timer = window.setInterval(() => {
        elapsed.value = Math.floor((Date.now() - startedAt) / 1000);
    }, 1000);
}
function parseRoute() {
    const rawSubject = String(route.params.subject ?? '');
    const rawGrade = String(route.params.grade ?? '');
    const rawUnit = Number.parseInt(String(route.params.unit ?? ''), 10);
    const rawLevel = Number.parseInt(String(route.params.level ?? ''), 10);
    if (!isValidSubject(rawSubject) || !isValidGrade(rawGrade) || Number.isNaN(rawUnit) || Number.isNaN(rawLevel)) {
        router.replace('/');
        return false;
    }
    const unitLevels = getUnitLevelCount(rawSubject, rawGrade, rawUnit);
    if (rawUnit <= 0 || rawLevel <= 0 || unitLevels <= 0 || rawLevel > unitLevels) {
        router.replace(`/unit/${rawSubject}/${rawGrade}`);
        return false;
    }
    if (!isLevelUnlocked(progressStore.progress, rawSubject, rawGrade, rawUnit, rawLevel)) {
        router.replace(`/level/${rawSubject}/${rawGrade}/${rawUnit}`);
        return false;
    }
    subjectId.value = rawSubject;
    gradeId.value = rawGrade;
    unit.value = rawUnit;
    level.value = rawLevel;
    return true;
}
function resetGame() {
    if (!subjectId.value || !gradeId.value) {
        return;
    }
    const words = getLevelWords(subjectId.value, gradeId.value, unit.value, level.value);
    if (words.length === 0) {
        router.replace(`/level/${subjectId.value}/${gradeId.value}/${unit.value}`);
        return;
    }
    tiles.value = createTiles(words, subjectId.value);
    selectedIndexes.value = [];
    resolvedCount.value = 0;
    errors.value = 0;
    resolving.value = false;
    finished.value = false;
    hintActive.value = false;
    progressStore.setCurrentPosition(subjectId.value, gradeId.value, unit.value, level.value);
    trackEvent('game_start', {
        subjectId: subjectId.value,
        gradeId: gradeId.value,
        unit: unit.value,
        level: level.value
    });
    startTimer();
}
function ensureAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}
function playTone(kind) {
    if (!progressStore.soundEnabled) {
        return;
    }
    try {
        const ctx = ensureAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (kind === 'match') {
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        }
        else {
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.1);
        }
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }
    catch {
        console.warn('浏览器不支持音频播放。');
    }
}
function finishLevel() {
    if (!subjectId.value || !gradeId.value || finished.value) {
        return;
    }
    finished.value = true;
    clearTimer();
    trackEvent('game_complete', {
        subjectId: subjectId.value,
        gradeId: gradeId.value,
        unit: unit.value,
        level: level.value,
        duration: elapsed.value,
        errorCount: errors.value
    });
    progressStore.completeLevel(subjectId.value, gradeId.value, unit.value, level.value, errors.value, elapsed.value);
    window.setTimeout(() => {
        router.push(`/victory/${subjectId.value}/${gradeId.value}/${unit.value}/${level.value}`);
    }, 1000);
}
function resolveSelection() {
    if (selectedIndexes.value.length !== 2) {
        return;
    }
    resolving.value = true;
    const [firstIndex, secondIndex] = selectedIndexes.value;
    const first = tiles.value[firstIndex];
    const second = tiles.value[secondIndex];
    const matched = first.pairId === second.pairId && first.type !== second.type;
    if (matched) {
        trackEvent('game_match_success', {
            subjectId: subjectId.value ?? undefined,
            gradeId: gradeId.value ?? undefined,
            unit: unit.value,
            level: level.value
        });
        playTone('match');
        window.setTimeout(() => {
            first.selected = false;
            second.selected = false;
            first.matched = true;
            second.matched = true;
            selectedIndexes.value = [];
            resolving.value = false;
            resolvedCount.value += 2;
            if (resolvedCount.value >= totalCards.value) {
                finishLevel();
            }
        }, 500);
        return;
    }
    trackEvent('game_match_fail', {
        subjectId: subjectId.value ?? undefined,
        gradeId: gradeId.value ?? undefined,
        unit: unit.value,
        level: level.value
    });
    playTone('error');
    errors.value += 1;
    first.mismatch = true;
    second.mismatch = true;
    window.setTimeout(() => {
        first.selected = false;
        second.selected = false;
        first.mismatch = false;
        second.mismatch = false;
        selectedIndexes.value = [];
        resolving.value = false;
    }, 800);
}
function clickTile(index) {
    if (resolving.value || finished.value) {
        return;
    }
    const tile = tiles.value[index];
    if (!tile || tile.matched || tile.selected) {
        return;
    }
    tile.selected = true;
    selectedIndexes.value.push(index);
    if (selectedIndexes.value.length === 2) {
        resolveSelection();
    }
}
function useHint() {
    if (resolving.value || finished.value) {
        return;
    }
    const chars = tiles.value.filter((tile) => !tile.matched && tile.type === 'char');
    if (chars.length === 0) {
        return;
    }
    const first = chars[0];
    const pair = tiles.value.find((tile) => !tile.matched && tile.type === 'pinyin' && tile.pairId === first.pairId);
    if (!pair) {
        return;
    }
    trackEvent('game_hint_use', {
        subjectId: subjectId.value ?? undefined,
        gradeId: gradeId.value ?? undefined,
        unit: unit.value,
        level: level.value
    });
    resolving.value = true;
    hintActive.value = true;
    errors.value += 1;
    first.selected = true;
    pair.selected = true;
    window.setTimeout(() => {
        if (!first.matched) {
            first.selected = false;
        }
        if (!pair.matched) {
            pair.selected = false;
        }
        hintActive.value = false;
        resolving.value = false;
    }, 1000);
}
function toggleSound() {
    progressStore.toggleSound();
}
function goBack() {
    if (!subjectId.value || !gradeId.value) {
        router.push('/');
        return;
    }
    router.push(`/level/${subjectId.value}/${gradeId.value}/${unit.value}`);
}
watch(() => route.fullPath, () => {
    if (parseRoute()) {
        resetGame();
    }
}, { immediate: true });
onBeforeUnmount(() => {
    clearTimer();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.subjectId && __VLS_ctx.gradeId && __VLS_ctx.subjectMeta) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "page game-page" },
    });
    /** @type {__VLS_StyleScopedClasses['page']} */ ;
    /** @type {__VLS_StyleScopedClasses['game-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "game-header" },
    });
    /** @type {__VLS_StyleScopedClasses['game-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "btn btn-back" },
    });
    /** @type {__VLS_StyleScopedClasses['btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-back']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "level-title" },
    });
    /** @type {__VLS_StyleScopedClasses['level-title']} */ ;
    (__VLS_ctx.levelTitle);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "subject-chip" },
    });
    /** @type {__VLS_StyleScopedClasses['subject-chip']} */ ;
    (__VLS_ctx.subjectMeta.icon);
    (__VLS_ctx.subjectMeta.name);
    (__VLS_ctx.pairLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "timer-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['timer-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.timerText);
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "game-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['game-grid']} */ ;
    for (const [tile, index] of __VLS_vFor((__VLS_ctx.tiles))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.subjectId && __VLS_ctx.gradeId && __VLS_ctx.subjectMeta))
                        return;
                    __VLS_ctx.clickTile(index);
                    // @ts-ignore
                    [subjectId, gradeId, subjectMeta, subjectMeta, subjectMeta, goBack, levelTitle, pairLabel, timerText, tiles, clickTile,];
                } },
            key: (tile.id),
            ...{ class: "tile" },
            ...{ class: ([tile.type, { selected: tile.selected, matched: tile.matched, hidden: tile.matched, mismatch: tile.mismatch }]) },
        });
        /** @type {__VLS_StyleScopedClasses['tile']} */ ;
        /** @type {__VLS_StyleScopedClasses['selected']} */ ;
        /** @type {__VLS_StyleScopedClasses['matched']} */ ;
        /** @type {__VLS_StyleScopedClasses['hidden']} */ ;
        /** @type {__VLS_StyleScopedClasses['mismatch']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (tile.content);
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({
        ...{ class: "game-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['game-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "progress-area" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-area']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "progress-text" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-text']} */ ;
    (__VLS_ctx.progressText);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "progress-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: "progress-fill" },
        ...{ style: ({ width: `${__VLS_ctx.progressWidth}%` }) },
    });
    /** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "game-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['game-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.useHint) },
        ...{ class: "btn" },
        ...{ class: ({ active: __VLS_ctx.hintActive }) },
    });
    /** @type {__VLS_StyleScopedClasses['btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleSound) },
        ...{ class: "btn" },
    });
    /** @type {__VLS_StyleScopedClasses['btn']} */ ;
    (__VLS_ctx.progressStore.soundEnabled ? '🔊 声音' : '🔇 静音');
}
// @ts-ignore
[progressText, progressWidth, useHint, hintActive, toggleSound, progressStore,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
