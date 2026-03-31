import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME, loginAdmin } from '@/domain/adminAuth';
const route = useRoute();
const router = useRouter();
const username = ref('');
const password = ref('');
const errorText = ref('');
const submitting = ref(false);
const redirectPath = computed(() => {
    const redirect = route.query.redirect;
    return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/admin';
});
function submitLogin() {
    if (submitting.value) {
        return;
    }
    errorText.value = '';
    submitting.value = true;
    const success = loginAdmin(username.value, password.value);
    submitting.value = false;
    if (!success) {
        errorText.value = '账号或密码错误，请重试。';
        return;
    }
    router.replace(redirectPath.value);
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "page admin-login-page" },
});
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-login-page']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "admin-login-card" },
});
/** @type {__VLS_StyleScopedClasses['admin-login-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "admin-subtitle" },
});
/** @type {__VLS_StyleScopedClasses['admin-subtitle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "admin-field" },
});
/** @type {__VLS_StyleScopedClasses['admin-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    value: (__VLS_ctx.username),
    type: "text",
    autocomplete: "username",
    placeholder: "请输入账号",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
    ...{ class: "admin-field" },
});
/** @type {__VLS_StyleScopedClasses['admin-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    ...{ onKeyup: (__VLS_ctx.submitLogin) },
    type: "password",
    autocomplete: "current-password",
    placeholder: "请输入密码",
});
(__VLS_ctx.password);
if (__VLS_ctx.errorText) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "admin-error" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-error']} */ ;
    (__VLS_ctx.errorText);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.submitLogin) },
    ...{ class: "btn btn-primary admin-submit" },
    type: "button",
    disabled: (__VLS_ctx.submitting),
});
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-submit']} */ ;
(__VLS_ctx.submitting ? '登录中...' : '登录');
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "admin-hint" },
});
/** @type {__VLS_StyleScopedClasses['admin-hint']} */ ;
(__VLS_ctx.DEFAULT_ADMIN_USERNAME);
(__VLS_ctx.DEFAULT_ADMIN_PASSWORD);
// @ts-ignore
[username, submitLogin, submitLogin, password, errorText, errorText, submitting, submitting, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
