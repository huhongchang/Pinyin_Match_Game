<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { trackEvent } from '@/domain/analytics';
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

watch(
  () => route.fullPath,
  () => {
    if (!subjectId.value || !gradeId.value || Number.isNaN(unit.value) || unit.value <= 0) {
      return;
    }

    trackEvent('level_enter', {
      subjectId: subjectId.value,
      gradeId: gradeId.value,
      unit: unit.value
    });
  },
  { immediate: true }
);

const levels = computed(() => {
  if (!subjectId.value || !gradeId.value) {
    return [] as number[];
  }
  const count = getUnitLevelCount(subjectId.value, gradeId.value, unit.value);
  return Array.from({ length: count }, (_, i) => i + 1);
});

function openLevel(level: number) {
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
</script>

<template>
  <main class="page list-page" v-if="subjectId && gradeId && subjectMeta">
    <header class="list-header">
      <button class="btn btn-back" @click="goBack">← 返回</button>
      <h2>{{ subjectMeta.icon }} {{ subjectMeta.name }} · {{ gradeId }} - 单元{{ unit }}</h2>
    </header>

    <section class="level-grid">
      <article
        v-for="level in levels"
        :key="level"
        class="list-card"
        :class="{
          locked: !isLevelUnlocked(progressStore.progress, subjectId, gradeId, unit, level),
          completed: isLevelCompleted(progressStore.progress, subjectId, gradeId, unit, level)
        }"
        @click="openLevel(level)"
      >
        <div class="list-title">关卡 {{ getGlobalLevelNumber(subjectId, gradeId, unit, level) }}</div>

        <div v-if="isLevelCompleted(progressStore.progress, subjectId, gradeId, unit, level)" class="level-stats">
          <div class="stars">
            <span
              v-for="n in 5"
              :key="n"
              class="star"
              :class="{ filled: n <= (getLevelStat(progressStore.progress, subjectId, gradeId, unit, level)?.stars ?? 0) }"
            >★</span>
          </div>
          <div class="time">
            {{ formatReadableTime(getLevelStat(progressStore.progress, subjectId, gradeId, unit, level)?.time ?? 0) }}
          </div>
        </div>

        <div class="list-status" v-else-if="!isLevelUnlocked(progressStore.progress, subjectId, gradeId, unit, level)">🔒</div>
        <div class="list-status" v-else>🎮</div>
      </article>
    </section>
  </main>
</template>
