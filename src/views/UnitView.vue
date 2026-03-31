<script setup lang="ts">
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

function openUnit(unit: number) {
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
</script>

<template>
  <main class="page list-page" v-if="subjectId && gradeId && subjectMeta">
    <header class="list-header">
      <button class="btn btn-back" @click="goBack">← 返回</button>
      <h2>{{ subjectMeta.icon }} {{ subjectMeta.name }} · {{ gradeId }} - 选择单元</h2>
    </header>

    <section class="unit-grid">
      <article
        v-for="unit in unitList"
        :key="unit"
        class="list-card"
        :class="{ locked: isUnitLocked(progressStore.progress, subjectId, gradeId, unit), completed: isUnitCompleted(progressStore.progress, subjectId, gradeId, unit) }"
        @click="openUnit(unit)"
      >
        <div class="list-icon">
          {{ isUnitLocked(progressStore.progress, subjectId, gradeId, unit) ? '🔒' : '📚' }}
        </div>
        <div class="list-title">单元 {{ unit }}</div>
        <div class="list-status" v-if="isUnitCompleted(progressStore.progress, subjectId, gradeId, unit)">✅ 已完成</div>
        <div class="list-status" v-else-if="isUnitLocked(progressStore.progress, subjectId, gradeId, unit)">🔒 锁定</div>
        <div class="list-status" v-else>🎮 可玩</div>
      </article>
    </section>
  </main>
</template>
