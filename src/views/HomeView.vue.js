import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { SUBJECT_META } from '@/data/books';
import { trackEvent } from '@/domain/analytics';
import { getSubjectTotalLevels } from '@/domain/game';
import { getSubjectCompletedCount } from '@/domain/progress';
import { useProgressStore } from '@/stores/progress';
const router = useRouter();
const progressStore = useProgressStore();
const subjectCards = computed(() => {
    return SUBJECT_META.map((subject) => {
        const total = getSubjectTotalLevels(subject.id);
        const completed = getSubjectCompletedCount(progressStore.progress, subject.id);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
            ...subject,
            total,
            completed,
            progress
        };
    });
});
function openSubject(subjectId) {
    trackEvent('subject_enter', { subjectId });
    const nextGrade = progressStore.progress.currentSubject === subjectId ? progressStore.progress.currentGrade : '一年级上册';
    progressStore.setCurrentPosition(subjectId, nextGrade, 1, 1);
    router.push(`/grade/${subjectId}`);
}
function openAdmin() {
    router.push('/admin/login');
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "page home-page" },
});
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['home-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "hero" },
});
/** @type {__VLS_StyleScopedClasses['hero']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "brand" },
});
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "subject-grid" },
});
/** @type {__VLS_StyleScopedClasses['subject-grid']} */ ;
for (const [subject] of __VLS_vFor((__VLS_ctx.subjectCards))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openSubject(subject.id);
                // @ts-ignore
                [subjectCards, openSubject,];
            } },
        key: (subject.id),
        ...{ class: "subject-card" },
        ...{ class: (subject.id) },
    });
    /** @type {__VLS_StyleScopedClasses['subject-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "subject-top" },
    });
    /** @type {__VLS_StyleScopedClasses['subject-top']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "subject-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['subject-icon']} */ ;
    (subject.icon);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "subject-title" },
    });
    /** @type {__VLS_StyleScopedClasses['subject-title']} */ ;
    (subject.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "subject-desc" },
    });
    /** @type {__VLS_StyleScopedClasses['subject-desc']} */ ;
    (subject.description);
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
        ...{ style: ({ width: `${subject.progress}%` }) },
    });
    /** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "progress-text" },
    });
    /** @type {__VLS_StyleScopedClasses['progress-text']} */ ;
    (subject.completed);
    (subject.total);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "subject-tip" },
    });
    /** @type {__VLS_StyleScopedClasses['subject-tip']} */ ;
    (subject.name);
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.footer, __VLS_intrinsics.footer)({
    ...{ class: "footer-note" },
});
/** @type {__VLS_StyleScopedClasses['footer-note']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openAdmin) },
    ...{ class: "btn admin-entry-btn" },
});
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-entry-btn']} */ ;
// @ts-ignore
[openAdmin,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
