import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatReadableTime, getGlobalLevelNumber, getLevelWords, getSubjectMeta, getUnitLevelCount, isValidGrade, isValidSubject } from '@/domain/game';
import { getLevelStat, getNextLevel } from '@/domain/progress';
import { displayPinyin } from '@/domain/pinyin';
import { useProgressStore } from '@/stores/progress';
const route = useRoute();
const router = useRouter();
const progressStore = useProgressStore();
const subjectId = computed(() => {
    const value = String(route.params.subject ?? '');
    return isValidSubject(value) ? value : null;
});
const gradeId = computed(() => {
    const value = String(route.params.grade ?? '');
    return isValidGrade(value) ? value : null;
});
const subjectMeta = computed(() => {
    if (!subjectId.value) {
        return null;
    }
    return getSubjectMeta(subjectId.value);
});
const unit = computed(() => Number.parseInt(String(route.params.unit ?? ''), 10));
const level = computed(() => Number.parseInt(String(route.params.level ?? ''), 10));
watchEffect(() => {
    if (!subjectId.value || !gradeId.value || Number.isNaN(unit.value) || Number.isNaN(level.value)) {
        router.replace('/');
        return;
    }
    const max = getUnitLevelCount(subjectId.value, gradeId.value, unit.value);
    if (unit.value <= 0 || level.value <= 0 || max <= 0 || level.value > max) {
        router.replace(`/unit/${subjectId.value}/${gradeId.value}`);
    }
});
const stat = computed(() => {
    if (!subjectId.value || !gradeId.value) {
        return null;
    }
    return getLevelStat(progressStore.progress, subjectId.value, gradeId.value, unit.value, level.value);
});
const nextLevel = computed(() => {
    if (!subjectId.value || !gradeId.value) {
        return null;
    }
    return getNextLevel(subjectId.value, gradeId.value, unit.value, level.value);
});
const words = computed(() => {
    if (!subjectId.value || !gradeId.value) {
        return [];
    }
    return getLevelWords(subjectId.value, gradeId.value, unit.value, level.value).map((word) => ({
        ...word,
        displayPinyin: subjectId.value === 'chinese' ? displayPinyin(word.pinyin, word.char) : word.pinyin
    }));
});
function goNext() {
    if (!subjectId.value || !gradeId.value || !nextLevel.value) {
        return;
    }
    router.push(`/game/${subjectId.value}/${gradeId.value}/${nextLevel.value.unit}/${nextLevel.value.level}`);
}
function goBack() {
    if (!subjectId.value || !gradeId.value) {
        router.push('/');
        return;
    }
    router.push(`/level/${subjectId.value}/${gradeId.value}/${unit.value}`);
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.subjectId && __VLS_ctx.gradeId && __VLS_ctx.subjectMeta) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "page victory-page" },
    });
    /** @type {__VLS_StyleScopedClasses['page']} */ ;
    /** @type {__VLS_StyleScopedClasses['victory-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "victory-card" },
    });
    /** @type {__VLS_StyleScopedClasses['victory-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "trophy" },
    });
    /** @type {__VLS_StyleScopedClasses['trophy']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "victory-title" },
    });
    /** @type {__VLS_StyleScopedClasses['victory-title']} */ ;
    (__VLS_ctx.subjectMeta.icon);
    (__VLS_ctx.subjectMeta.name);
    (__VLS_ctx.gradeId);
    (__VLS_ctx.unit);
    (__VLS_ctx.getGlobalLevelNumber(__VLS_ctx.subjectId, __VLS_ctx.gradeId, __VLS_ctx.unit, __VLS_ctx.level));
    if (__VLS_ctx.stat) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "victory-stats" },
        });
        /** @type {__VLS_StyleScopedClasses['victory-stats']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "stars" },
        });
        /** @type {__VLS_StyleScopedClasses['stars']} */ ;
        for (const [n] of __VLS_vFor((5))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                key: (n),
                ...{ class: "star" },
                ...{ class: ({ filled: n <= __VLS_ctx.stat.stars }) },
            });
            /** @type {__VLS_StyleScopedClasses['star']} */ ;
            /** @type {__VLS_StyleScopedClasses['filled']} */ ;
            // @ts-ignore
            [subjectId, subjectId, gradeId, gradeId, gradeId, subjectMeta, subjectMeta, subjectMeta, unit, unit, getGlobalLevelNumber, level, stat, stat,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "time" },
        });
        /** @type {__VLS_StyleScopedClasses['time']} */ ;
        (__VLS_ctx.formatReadableTime(__VLS_ctx.stat.time));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "word-list-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['word-list-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (__VLS_ctx.subjectMeta.victoryTitle);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "word-list" },
    });
    /** @type {__VLS_StyleScopedClasses['word-list']} */ ;
    for (const [word] of __VLS_vFor((__VLS_ctx.words))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (`${word.char}-${word.pinyin}`),
            ...{ class: "word-row" },
        });
        /** @type {__VLS_StyleScopedClasses['word-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pinyin" },
        });
        /** @type {__VLS_StyleScopedClasses['pinyin']} */ ;
        (word.displayPinyin);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "char" },
        });
        /** @type {__VLS_StyleScopedClasses['char']} */ ;
        (word.char);
        // @ts-ignore
        [subjectMeta, stat, formatReadableTime, words,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "victory-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['victory-actions']} */ ;
    if (__VLS_ctx.nextLevel) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.goNext) },
            ...{ class: "btn btn-primary" },
        });
        /** @type {__VLS_StyleScopedClasses['btn']} */ ;
        /** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "btn" },
    });
    /** @type {__VLS_StyleScopedClasses['btn']} */ ;
}
// @ts-ignore
[nextLevel, goNext, goBack,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
