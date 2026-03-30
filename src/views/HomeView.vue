<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { SUBJECT_META } from '@/data/books';
import { getSubjectTotalLevels } from '@/domain/game';
import { getSubjectCompletedCount } from '@/domain/progress';
import { useProgressStore } from '@/stores/progress';
import type { SubjectId } from '@/types';

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

function openSubject(subjectId: SubjectId) {
  const nextGrade =
    progressStore.progress.currentSubject === subjectId ? progressStore.progress.currentGrade : '一年级上册';
  progressStore.setCurrentPosition(subjectId, nextGrade, 1, 1);
  router.push(`/grade/${subjectId}`);
}
</script>

<template>
  <main class="page home-page">
    <header class="hero">
      <div class="brand">📚 人教版</div>
      <h1>学科消消乐</h1>
      <p>先选择学科，再进入对应年级和关卡练习</p>
    </header>

    <section class="subject-grid">
      <article
        v-for="subject in subjectCards"
        :key="subject.id"
        class="subject-card"
        :class="subject.id"
        @click="openSubject(subject.id)"
      >
        <div class="subject-top">
          <div class="subject-icon">{{ subject.icon }}</div>
          <div class="subject-title">{{ subject.name }}</div>
        </div>
        <div class="subject-desc">{{ subject.description }}</div>
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${subject.progress}%` }" />
          </div>
          <div class="progress-text">{{ subject.completed }} / {{ subject.total }} 关</div>
        </div>
        <div class="subject-tip">点击进入 {{ subject.name }} 训练</div>
      </article>
    </section>

    <footer class="footer-note">
      <p>每日15分钟，三科同步巩固</p>
      <p>纯本地学习，无广告，不收集信息</p>
    </footer>
  </main>
</template>
