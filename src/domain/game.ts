import { BOOK_DATA, GRADE_META, SUBJECT_META, UNIT_LEVEL_LAYOUT } from '@/data/books';
import type { GradeId, SubjectId, SubjectMeta, TileItem, WordPair } from '@/types';
import { displayPinyin } from './pinyin';

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getGradeUnits(gradeId: GradeId): number {
  return GRADE_META.find((x) => x.id === gradeId)?.units ?? 0;
}

export function getUnitLevelCount(subjectId: SubjectId, gradeId: GradeId, unit: number): number {
  const words = BOOK_DATA[subjectId]?.[gradeId]?.[unit] ?? [];
  if (words.length === 0) {
    return 0;
  }
  return Math.ceil(words.length / 12);
}

export function getGradeTotalLevels(subjectId: SubjectId, gradeId: GradeId): number {
  const units = getGradeUnits(gradeId);
  let total = 0;
  for (let unit = 1; unit <= units; unit += 1) {
    total += getUnitLevelCount(subjectId, gradeId, unit);
  }
  return total;
}

export function getSubjectTotalLevels(subjectId: SubjectId): number {
  return GRADE_META.reduce((sum, grade) => sum + getGradeTotalLevels(subjectId, grade.id), 0);
}

export function getGlobalLevelNumber(subjectId: SubjectId, gradeId: GradeId, unit: number, level: number): number {
  let total = 0;
  for (let u = 1; u < unit; u += 1) {
    total += getUnitLevelCount(subjectId, gradeId, u);
  }
  return total + level;
}

export function getLevelWords(subjectId: SubjectId, gradeId: GradeId, unit: number, level: number): WordPair[] {
  const allWords = BOOK_DATA[subjectId]?.[gradeId]?.[unit] ?? [];
  if (allWords.length === 0) {
    return [];
  }

  const start = (level - 1) * 12;
  const end = start + 12;
  const primary = allWords.slice(start, end).map((w) => ({ ...w, isReview: false }));

  if (primary.length >= 12 || start === 0) {
    return primary;
  }

  const pool = shuffle(allWords.slice(0, start));
  const need = 12 - primary.length;
  const review = pool.slice(0, need).map((w) => ({ ...w, isReview: true }));
  return [...primary, ...review];
}

export function createTiles(words: WordPair[], subjectId: SubjectId): TileItem[] {
  const tiles: TileItem[] = [];
  words.forEach((word, idx) => {
    const rightValue = subjectId === 'chinese' ? displayPinyin(word.pinyin, word.char) : word.pinyin;

    tiles.push({
      id: `left-${idx}-${word.char}`,
      pairId: idx,
      type: 'char',
      content: word.char,
      selected: false,
      matched: false,
      mismatch: false
    });

    tiles.push({
      id: `right-${idx}-${word.pinyin}`,
      pairId: idx,
      type: 'pinyin',
      content: rightValue,
      selected: false,
      matched: false,
      mismatch: false
    });
  });

  return shuffle(tiles);
}

export function calcStars(errors: number): number {
  if (errors === 0) {
    return 5;
  }
  if (errors <= 2) {
    return 4;
  }
  if (errors <= 4) {
    return 3;
  }
  return 2;
}

export function formatMMSS(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatReadableTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}分${String(seconds).padStart(2, '0')}秒`;
}

export function isValidSubject(input: string): input is SubjectId {
  return SUBJECT_META.some((subject) => subject.id === input);
}

export function getSubjectMeta(subjectId: SubjectId): SubjectMeta {
  return SUBJECT_META.find((subject) => subject.id === subjectId) ?? SUBJECT_META[0];
}

export function isValidGrade(input: string): input is GradeId {
  return Object.prototype.hasOwnProperty.call(UNIT_LEVEL_LAYOUT, input);
}
