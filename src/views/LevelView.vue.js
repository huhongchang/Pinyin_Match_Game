import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getGlobalLevelNumber, getSubjectMeta, getUnitLevelCount, isValidGrade, isValidSubject } from '@/domain/game';
import { getLevelStat, isLevelCompleted, isLevelUnlocked } from '@/domain/progress';
import { formatReadableTime } from '@/domain/game';
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
watchEffect(() => {
    if (!subjectId.value || !gradeId.value || Number.isNaN(unit.value) || unit.value <= 0) {
        router.replace('/');
        return;
    }
    const levelCount = getUnitLevelCount(subjectId.value, gradeId.value, unit.value);
    if (levelCount <= 0) {
        router.replace(`/unit/${subjectId.value}/${gradeId.value}`);
    }
});
const levels = computed(() => {
    if (!subjectId.value || !gradeId.value) {
        return [];
    }
    const count = getUnitLevelCount(subjectId.value, gradeId.value, unit.value);
    return Array.from({ length: count }, (_, i) => i + 1);
});
function openLevel(level) {
    if (!subjectId.value || !gradeId.value) {
        return;
    }
    if (!isLevelUnlocked(progressStore.progress, subjectId.value, gradeId.value, unit.value, level)) {
        return;
    }
    router.push(`/game/${subjectId.value}/${gradeId.value}/${unit.value}/${level}`);
}
function goBack() {
    if (!subjectId.value || !gradeId.value) {
        router.push('/');
        return;
    }
    router.push(`/unit/${subjectId.value}/${gradeId.value}`);
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
        ...{ class: "page list-page" },
    });
    /** @type {__VLS_StyleScopedClasses['page']} */ ;
    /** @type {__VLS_StyleScopedClasses['list-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "list-header" },
    });
    /** @type {__VLS_StyleScopedClasses['list-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "btn btn-back" },
    });
    /** @type {__VLS_StyleScopedClasses['btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['btn-back']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    (__VLS_ctx.subjectMeta.icon);
    (__VLS_ctx.subjectMeta.name);
    (__VLS_ctx.gradeId);
    (__VLS_ctx.unit);
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "level-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['level-grid']} */ ;
    for (const [level] of __VLS_vFor((__VLS_ctx.levels))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.subjectId && __VLS_ctx.gradeId && __VLS_ctx.subjectMeta))
                        return;
                    __VLS_ctx.openLevel(level);
                    // @ts-ignore
                    [subjectId, gradeId, gradeId, subjectMeta, subjectMeta, subjectMeta, goBack, unit, levels, openLevel,];
                } },
            key: (level),
            ...{ class: "list-card" },
            ...{ class: ({
                    locked: !__VLS_ctx.isLevelUnlocked(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, __VLS_ctx.unit, level),
                    completed: __VLS_ctx.isLevelCompleted(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, __VLS_ctx.unit, level)
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['list-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['locked']} */ ;
        /** @type {__VLS_StyleScopedClasses['completed']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-title" },
        });
        /** @type {__VLS_StyleScopedClasses['list-title']} */ ;
        (__VLS_ctx.getGlobalLevelNumber(__VLS_ctx.subjectId, __VLS_ctx.gradeId, __VLS_ctx.unit, level));
        if (__VLS_ctx.isLevelCompleted(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, __VLS_ctx.unit, level)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "level-stats" },
            });
            /** @type {__VLS_StyleScopedClasses['level-stats']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "stars" },
            });
            /** @type {__VLS_StyleScopedClasses['stars']} */ ;
            for (const [n] of __VLS_vFor((5))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    key: (n),
                    ...{ class: "star" },
                    ...{ class: ({ filled: n <= (__VLS_ctx.getLevelStat(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, __VLS_ctx.unit, level)?.stars ?? 0) }) },
                });
                /** @type {__VLS_StyleScopedClasses['star']} */ ;
                /** @type {__VLS_StyleScopedClasses['filled']} */ ;
                // @ts-ignore
                [subjectId, subjectId, subjectId, subjectId, subjectId, gradeId, gradeId, gradeId, gradeId, gradeId, unit, unit, unit, unit, unit, isLevelUnlocked, progressStore, progressStore, progressStore, progressStore, isLevelCompleted, isLevelCompleted, getGlobalLevelNumber, getLevelStat,];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "time" },
            });
            /** @type {__VLS_StyleScopedClasses['time']} */ ;
            (__VLS_ctx.formatReadableTime(__VLS_ctx.getLevelStat(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, __VLS_ctx.unit, level)?.time ?? 0));
        }
        else if (!__VLS_ctx.isLevelUnlocked(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, __VLS_ctx.unit, level)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-status" },
            });
            /** @type {__VLS_StyleScopedClasses['list-status']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-status" },
            });
            /** @type {__VLS_StyleScopedClasses['list-status']} */ ;
        }
        // @ts-ignore
        [subjectId, subjectId, gradeId, gradeId, unit, unit, isLevelUnlocked, progressStore, progressStore, getLevelStat, formatReadableTime,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
