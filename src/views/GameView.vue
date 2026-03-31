<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { trackEvent } from '@/domain/analytics';
import {
  createTiles,
  formatMMSS,
  getGlobalLevelNumber,
  getLevelWords,
  getSubjectMeta,
  getUnitLevelCount,
  isValidGrade,
  isValidSubject
} from '@/domain/game';
import { isLevelUnlocked } from '@/domain/progress';
import { useProgressStore } from '@/stores/progress';
import type { GradeId, SubjectId, TileItem } from '@/types';

const route = useRoute();
const router = useRouter();
const progressStore = useProgressStore();

const subjectId = ref<SubjectId | null>(null);
const gradeId = ref<GradeId | null>(null);
const unit = ref(1);
const level = ref(1);

const tiles = ref<TileItem[]>([]);
const selectedIndexes = ref<number[]>([]);
const resolvedCount = ref(0);
const errors = ref(0);
const resolving = ref(false);
const finished = ref(false);
const hintActive = ref(false);

const elapsed = ref(0);
let timer: number | null = null;
let startedAt = Date.now();
let audioContext: AudioContext | null = null;

const totalCards = computed(() => tiles.value.length);
const progressText = computed(() => `${resolvedCount.value}/${totalCards.value}`);
const progressWidth = computed(() => {
  if (totalCards.value === 0) {
    return 0;
  }
  return Math.round((resolvedCount.value / totalCards.value) * 100);
});

const timerText = computed(() => formatMMSS(elapsed.value));
const subjectMeta = computed(() => {
  if (!subjectId.value) {
    return null;
  }
  return getSubjectMeta(subjectId.value);
});

const levelTitle = computed(() => {
  if (!subjectId.value || !gradeId.value) {
    return '第 0 关';
  }
  return `第 ${getGlobalLevelNumber(subjectId.value, gradeId.value, unit.value, level.value)} 关`;
});

const pairLabel = computed(() => {
  if (!subjectMeta.value) {
    return '';
  }
  return `${subjectMeta.value.leftLabel} - ${subjectMeta.value.rightLabel}`;
});

function clearTimer() {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

function startTimer() {
  clearTimer();
  startedAt = Date.now();
  elapsed.value = 0;
  timer = window.setInterval(() => {
    elapsed.value = Math.floor((Date.now() - startedAt) / 1000);
  }, 1000);
}

function parseRoute(): boolean {
  const rawSubject = String(route.params.subject ?? '');
  const rawGrade = String(route.params.grade ?? '');
  const rawUnit = Number.parseInt(String(route.params.unit ?? ''), 10);
  const rawLevel = Number.parseInt(String(route.params.level ?? ''), 10);

  if (!isValidSubject(rawSubject) || !isValidGrade(rawGrade) || Number.isNaN(rawUnit) || Number.isNaN(rawLevel)) {
    router.replace('/');
    return false;
  }

  const unitLevels = getUnitLevelCount(rawSubject, rawGrade, rawUnit);
  if (rawUnit <= 0 || rawLevel <= 0 || unitLevels <= 0 || rawLevel > unitLevels) {
    router.replace(`/unit/${rawSubject}/${rawGrade}`);
    return false;
  }

  if (!isLevelUnlocked(progressStore.progress, rawSubject, rawGrade, rawUnit, rawLevel)) {
    router.replace(`/level/${rawSubject}/${rawGrade}/${rawUnit}`);
    return false;
  }

  subjectId.value = rawSubject;
  gradeId.value = rawGrade;
  unit.value = rawUnit;
  level.value = rawLevel;
  return true;
}

function resetGame() {
  if (!subjectId.value || !gradeId.value) {
    return;
  }

  const words = getLevelWords(subjectId.value, gradeId.value, unit.value, level.value);
  if (words.length === 0) {
    router.replace(`/level/${subjectId.value}/${gradeId.value}/${unit.value}`);
    return;
  }

  tiles.value = createTiles(words, subjectId.value);
  selectedIndexes.value = [];
  resolvedCount.value = 0;
  errors.value = 0;
  resolving.value = false;
  finished.value = false;
  hintActive.value = false;
  progressStore.setCurrentPosition(subjectId.value, gradeId.value, unit.value, level.value);
  trackEvent('game_start', {
    subjectId: subjectId.value,
    gradeId: gradeId.value,
    unit: unit.value,
    level: level.value
  });
  startTimer();
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(kind: 'match' | 'error') {
  if (!progressStore.soundEnabled) {
    return;
  }

  try {
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === 'match') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.1);
    }

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    console.warn('浏览器不支持音频播放。');
  }
}

function finishLevel() {
  if (!subjectId.value || !gradeId.value || finished.value) {
    return;
  }

  finished.value = true;
  clearTimer();

  trackEvent('game_complete', {
    subjectId: subjectId.value,
    gradeId: gradeId.value,
    unit: unit.value,
    level: level.value,
    duration: elapsed.value,
    errorCount: errors.value
  });

  progressStore.completeLevel(subjectId.value, gradeId.value, unit.value, level.value, errors.value, elapsed.value);

  window.setTimeout(() => {
    router.push(`/victory/${subjectId.value}/${gradeId.value}/${unit.value}/${level.value}`);
  }, 1000);
}

function resolveSelection() {
  if (selectedIndexes.value.length !== 2) {
    return;
  }

  resolving.value = true;
  const [firstIndex, secondIndex] = selectedIndexes.value;
  const first = tiles.value[firstIndex];
  const second = tiles.value[secondIndex];

  const matched = first.pairId === second.pairId && first.type !== second.type;

  if (matched) {
    trackEvent('game_match_success', {
      subjectId: subjectId.value ?? undefined,
      gradeId: gradeId.value ?? undefined,
      unit: unit.value,
      level: level.value
    });

    playTone('match');
    window.setTimeout(() => {
      first.selected = false;
      second.selected = false;
      first.matched = true;
      second.matched = true;
      selectedIndexes.value = [];
      resolving.value = false;
      resolvedCount.value += 2;

      if (resolvedCount.value >= totalCards.value) {
        finishLevel();
      }
    }, 500);
    return;
  }

  trackEvent('game_match_fail', {
    subjectId: subjectId.value ?? undefined,
    gradeId: gradeId.value ?? undefined,
    unit: unit.value,
    level: level.value
  });

  playTone('error');
  errors.value += 1;
  first.mismatch = true;
  second.mismatch = true;

  window.setTimeout(() => {
    first.selected = false;
    second.selected = false;
    first.mismatch = false;
    second.mismatch = false;
    selectedIndexes.value = [];
    resolving.value = false;
  }, 800);
}

function clickTile(index: number) {
  if (resolving.value || finished.value) {
    return;
  }

  const tile = tiles.value[index];
  if (!tile || tile.matched || tile.selected) {
    return;
  }

  tile.selected = true;
  selectedIndexes.value.push(index);

  if (selectedIndexes.value.length === 2) {
    resolveSelection();
  }
}

function useHint() {
  if (resolving.value || finished.value) {
    return;
  }

  const chars = tiles.value.filter((tile) => !tile.matched && tile.type === 'char');
  if (chars.length === 0) {
    return;
  }

  const first = chars[0];
  const pair = tiles.value.find((tile) => !tile.matched && tile.type === 'pinyin' && tile.pairId === first.pairId);
  if (!pair) {
    return;
  }

  trackEvent('game_hint_use', {
    subjectId: subjectId.value ?? undefined,
    gradeId: gradeId.value ?? undefined,
    unit: unit.value,
    level: level.value
  });

  resolving.value = true;
  hintActive.value = true;
  errors.value += 1;
  first.selected = true;
  pair.selected = true;

  window.setTimeout(() => {
    if (!first.matched) {
      first.selected = false;
    }
    if (!pair.matched) {
      pair.selected = false;
    }
    hintActive.value = false;
    resolving.value = false;
  }, 1000);
}

function toggleSound() {
  progressStore.toggleSound();
}

function goBack() {
  if (!subjectId.value || !gradeId.value) {
    router.push('/');
    return;
  }
  router.push(`/level/${subjectId.value}/${gradeId.value}/${unit.value}`);
}

watch(
  () => route.fullPath,
  () => {
    if (parseRoute()) {
      resetGame();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<template>
  <main class="page game-page" v-if="subjectId && gradeId && subjectMeta">
    <header class="game-header">
      <button class="btn btn-back" @click="goBack">← 返回</button>
      <div class="level-title">
        {{ levelTitle }}
        <span class="subject-chip">{{ subjectMeta.icon }} {{ subjectMeta.name }} · {{ pairLabel }}</span>
      </div>
      <div class="timer-wrap">
        <span>时间</span>
        <strong>{{ timerText }}</strong>
      </div>
    </header>

    <section class="game-grid">
      <button
        v-for="(tile, index) in tiles"
        :key="tile.id"
        class="tile"
        :class="[tile.type, { selected: tile.selected, matched: tile.matched, hidden: tile.matched, mismatch: tile.mismatch }]"
        @click="clickTile(index)"
      >
        <span>{{ tile.content }}</span>
      </button>
    </section>

    <footer class="game-footer">
      <div class="progress-area">
        <div class="progress-text">已配对: {{ progressText }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressWidth}%` }" />
        </div>
      </div>

      <div class="game-actions">
        <button class="btn" :class="{ active: hintActive }" @click="useHint">💡 提示</button>
        <button class="btn" @click="toggleSound">{{ progressStore.soundEnabled ? '🔊 声音' : '🔇 静音' }}</button>
      </div>
    </footer>
  </main>
</template>
