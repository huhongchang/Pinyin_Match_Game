import { defineStore } from 'pinia';
import type { GradeId, ProgressData, SubjectId } from '@/types';
import {
  createDefaultProgress,
  loadProgress,
  markLevelCompleted,
  saveProgress,
  updateBestStat
} from '@/domain/progress';

export const useProgressStore = defineStore('progress', {
  state: (): { progress: ProgressData } => ({
    progress: createDefaultProgress()
  }),

  getters: {
    soundEnabled: (state) => state.progress.settings.sound
  },

  actions: {
    init() {
      this.progress = loadProgress();
    },

    setCurrentPosition(subjectId: SubjectId, gradeId: GradeId, unit: number, level: number) {
      this.progress.currentSubject = subjectId;
      this.progress.currentGrade = gradeId;
      this.progress.currentUnit = unit;
      this.progress.currentLevel = level;
      saveProgress(this.progress);
    },

    toggleSound() {
      this.progress.settings.sound = !this.progress.settings.sound;
      saveProgress(this.progress);
    },

    completeLevel(subjectId: SubjectId, gradeId: GradeId, unit: number, level: number, errors: number, time: number) {
      markLevelCompleted(this.progress, subjectId, gradeId, unit, level);
      updateBestStat(this.progress, subjectId, gradeId, unit, level, errors, time);
      this.progress.currentSubject = subjectId;
      this.progress.currentGrade = gradeId;
      this.progress.currentUnit = unit;
      this.progress.currentLevel = level;
      saveProgress(this.progress);
    }
  }
});
