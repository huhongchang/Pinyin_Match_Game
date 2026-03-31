<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GRADE_META } from '@/data/books';
import { trackEvent } from '@/domain/analytics';
import { getGradeTotalLevels, getSubjectMeta, isValidSubject } from '@/domain/game';
import { getCompletedCount } from '@/domain/progress';
import { useProgressStore } from '@/stores/progress';
import type { GradeId } from '@/types';

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

watch(
  () => route.fullPath,
  () => {
    if (!subjectId.value) {
      return;
    }
    trackEvent('subject_enter', {
      subjectId: subjectId.value
    });
  },
  { immediate: true }
);

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

function openGrade(gradeId: GradeId) {
  if (!subjectId.value) {
    return;
  }
  progressStore.setCurrentPosition(subjectId.value, gradeId, 1, 1);
  router.push(`/unit/${subjectId.value}/${gradeId}`);
}

function goBack() {
  router.push('/');
}
</script>

<template>
  <main class="page list-page" v-if="subjectId && subjectMeta">
    <header class="list-header">
      <button class="btn btn-back" @click="goBack">← 返回</button>
      <h2>{{ subjectMeta.icon }} {{ subjectMeta.name }} - 选择年级册别</h2>
    </header>

    <section class="grade-grid grade-select-grid">
      <article
        v-for="grade in gradeCards"
        :key="grade.id"
        class="grade-card"
        @click="openGrade(grade.id)"
      >
        <div class="grade-icon">{{ grade.semester === '上册' ? '📖' : '📕' }}</div>
        <div class="grade-title">{{ grade.name }}</div>
        <div class="grade-semester">{{ grade.semester }}</div>
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${grade.progress}%` }" />
          </div>
          <div class="progress-text">{{ grade.completed }} / {{ grade.total }} 关</div>
        </div>
      </article>
    </section>
  </main>
</template>
