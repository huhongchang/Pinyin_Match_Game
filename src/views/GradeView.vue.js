import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GRADE_META } from '@/data/books';
import { getGradeTotalLevels, getSubjectMeta, isValidSubject } from '@/domain/game';
import { getCompletedCount } from '@/domain/progress';
import { useProgressStore } from '@/stores/progress';
const route = useRoute();
const router = useRouter();
const progressStore = useProgressStore();
const subjectId = computed(() => {
    const value = String(route.params.subject ?? '');
    return isValidSubject(value) ? value : null;
});
watchEffect(() => {
    if (!subjectId.value) {
        router.replace('/');
    }
});
const subjectMeta = computed(() => {
    if (!subjectId.value) {
        return null;
    }
    return getSubjectMeta(subjectId.value);
});
const gradeCards = computed(() => {
    const sid = subjectId.value;
    if (!sid) {
        return [];
    }
    return GRADE_META.map((grade) => {
        const total = getGradeTotalLevels(sid, grade.id);
        const completed = getCompletedCount(progressStore.progress, sid, grade.id);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
            ...grade,
            total,
            completed,
            progress
        };
    });
});
function openGrade(gradeId) {
    if (!subjectId.value) {
        return;
    }
    progressStore.setCurrentPosition(subjectId.value, gradeId, 1, 1);
    router.push(`/unit/${subjectId.value}/${gradeId}`);
}
function goBack() {
    router.push('/');
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.subjectId && __VLS_ctx.subjectMeta) {
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "grade-grid grade-select-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['grade-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['grade-select-grid']} */ ;
    for (const [grade] of __VLS_vFor((__VLS_ctx.gradeCards))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.subjectId && __VLS_ctx.subjectMeta))
                        return;
                    __VLS_ctx.openGrade(grade.id);
                    // @ts-ignore
                    [subjectId, subjectMeta, subjectMeta, subjectMeta, goBack, gradeCards, openGrade,];
                } },
            key: (grade.id),
            ...{ class: "grade-card" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grade-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-icon']} */ ;
        (grade.semester === '上册' ? '📖' : '📕');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grade-title" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-title']} */ ;
        (grade.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grade-semester" },
        });
        /** @type {__VLS_StyleScopedClasses['grade-semester']} */ ;
        (grade.semester);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-wrap" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-wrap']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-bar" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
            ...{ class: "progress-fill" },
            ...{ style: ({ width: `${grade.progress}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "progress-text" },
        });
        /** @type {__VLS_StyleScopedClasses['progress-text']} */ ;
        (grade.completed);
        (grade.total);
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
