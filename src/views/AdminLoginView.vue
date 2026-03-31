<script setup lang="ts">
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
</script>

<template>
  <main class="page admin-login-page">
    <section class="admin-login-card">
      <h1>管理后台登录</h1>
      <p class="admin-subtitle">查看网站使用数据</p>

      <label class="admin-field">
        <span>账号</span>
        <input v-model="username" type="text" autocomplete="username" placeholder="请输入账号" />
      </label>

      <label class="admin-field">
        <span>密码</span>
        <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" @keyup.enter="submitLogin" />
      </label>

      <p class="admin-error" v-if="errorText">{{ errorText }}</p>

      <button class="btn btn-primary admin-submit" type="button" @click="submitLogin" :disabled="submitting">
        {{ submitting ? '登录中...' : '登录' }}
      </button>

      <p class="admin-hint">默认账号：{{ DEFAULT_ADMIN_USERNAME }} / {{ DEFAULT_ADMIN_PASSWORD }}</p>
    </section>
  </main>
</template>
