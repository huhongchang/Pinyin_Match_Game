import { defineStore } from 'pinia';
import { createDefaultProgress, loadProgress, markLevelCompleted, saveProgress, updateBestStat } from '@/domain/progress';
export const useProgressStore = defineStore('progress', {
    state: () => ({
        progress: createDefaultProgress()
    }),
    getters: {
        soundEnabled: (state) => state.progress.settings.sound
    },
    actions: {
        init() {
            this.progress = loadProgress();
        },
        setCurrentPosition(subjectId, gradeId, unit, level) {
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
        completeLevel(subjectId, gradeId, unit, level, errors, time) {
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
