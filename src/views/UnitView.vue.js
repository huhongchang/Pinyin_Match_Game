import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GRADE_META } from '@/data/books';
import { trackEvent } from '@/domain/analytics';
import { getSubjectMeta, isValidGrade, isValidSubject } from '@/domain/game';
import { isUnitCompleted, isUnitLocked } from '@/domain/progress';
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
watchEffect(() => {
    if (!subjectId.value || !gradeId.value) {
        router.replace('/');
    }
});
const totalUnits = computed(() => {
    if (!gradeId.value) {
        return 0;
    }
    return GRADE_META.find((x) => x.id === gradeId.value)?.units ?? 0;
});
const unitList = computed(() => Array.from({ length: totalUnits.value }, (_, i) => i + 1));
function openUnit(unit) {
    if (!subjectId.value || !gradeId.value) {
        return;
    }
    if (isUnitLocked(progressStore.progress, subjectId.value, gradeId.value, unit)) {
        return;
    }
    trackEvent('unit_enter', {
        subjectId: subjectId.value,
        gradeId: gradeId.value,
        unit
    });
    router.push(`/level/${subjectId.value}/${gradeId.value}/${unit}`);
}
function goBack() {
    if (!subjectId.value) {
        router.push('/');
        return;
    }
    router.push(`/grade/${subjectId.value}`);
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "unit-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['unit-grid']} */ ;
    for (const [unit] of __VLS_vFor((__VLS_ctx.unitList))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.subjectId && __VLS_ctx.gradeId && __VLS_ctx.subjectMeta))
                        return;
                    __VLS_ctx.openUnit(unit);
                    // @ts-ignore
                    [subjectId, gradeId, gradeId, subjectMeta, subjectMeta, subjectMeta, goBack, unitList, openUnit,];
                } },
            key: (unit),
            ...{ class: "list-card" },
            ...{ class: ({ locked: __VLS_ctx.isUnitLocked(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, unit), completed: __VLS_ctx.isUnitCompleted(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, unit) }) },
        });
        /** @type {__VLS_StyleScopedClasses['list-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['locked']} */ ;
        /** @type {__VLS_StyleScopedClasses['completed']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['list-icon']} */ ;
        (__VLS_ctx.isUnitLocked(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, unit) ? '🔒' : '📚');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-title" },
        });
        /** @type {__VLS_StyleScopedClasses['list-title']} */ ;
        (unit);
        if (__VLS_ctx.isUnitCompleted(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, unit)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-status" },
            });
            /** @type {__VLS_StyleScopedClasses['list-status']} */ ;
        }
        else if (__VLS_ctx.isUnitLocked(__VLS_ctx.progressStore.progress, __VLS_ctx.subjectId, __VLS_ctx.gradeId, unit)) {
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
        [subjectId, subjectId, subjectId, subjectId, subjectId, gradeId, gradeId, gradeId, gradeId, gradeId, isUnitLocked, isUnitLocked, isUnitLocked, progressStore, progressStore, progressStore, progressStore, progressStore, isUnitCompleted, isUnitCompleted,];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
