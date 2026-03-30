<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  formatReadableTime,
  getGlobalLevelNumber,
  getLevelWords,
  getSubjectMeta,
  getUnitLevelCount,
  isValidGrade,
  isValidSubject
} from '@/domain/game';
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
</script>

<template>
  <main class="page victory-page" v-if="subjectId && gradeId && subjectMeta">
    <section class="victory-card">
      <div class="trophy">🏆</div>
      <h1>恭喜通关！</h1>
      <p class="victory-title">
        {{ subjectMeta.icon }} {{ subjectMeta.name }} · {{ gradeId }} 单元{{ unit }} 第{{ getGlobalLevelNumber(subjectId, gradeId, unit, level) }}关
      </p>

      <div class="victory-stats" v-if="stat">
        <div class="stars">
          <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= stat.stars }">★</span>
        </div>
        <div class="time">耗时: {{ formatReadableTime(stat.time) }}</div>
      </div>

      <section class="word-list-wrap">
        <h3>{{ subjectMeta.victoryTitle }}</h3>
        <div class="word-list">
          <div v-for="word in words" :key="`${word.char}-${word.pinyin}`" class="word-row">
            <span class="pinyin">{{ word.displayPinyin }}</span>
            <span class="char">{{ word.char }}</span>
          </div>
        </div>
      </section>

      <div class="victory-actions">
        <button class="btn btn-primary" v-if="nextLevel" @click="goNext">下一关</button>
        <button class="btn" @click="goBack">返回关卡列表</button>
      </div>
    </section>
  </main>
</template>
