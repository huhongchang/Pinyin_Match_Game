export type SubjectId = 'chinese' | 'math' | 'english';

export type GradeId =
  | '一年级上册'
  | '一年级下册'
  | '二年级上册'
  | '二年级下册'
  | '三年级上册'
  | '三年级下册'
  | '四年级上册'
  | '四年级下册'
  | '五年级上册'
  | '五年级下册'
  | '六年级上册'
  | '六年级下册';

export type ProgressScopeKey = `${SubjectId}:${GradeId}`;

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  icon: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  victoryTitle: string;
}

export interface WordPair {
  char: string;
  pinyin: string;
  isReview?: boolean;
}

export type TileType = 'char' | 'pinyin';

export interface TileItem {
  id: string;
  pairId: number;
  type: TileType;
  content: string;
  selected: boolean;
  matched: boolean;
  mismatch: boolean;
}

export interface GradeMeta {
  id: GradeId;
  name: string;
  semester: '上册' | '下册';
  units: number;
}

export interface LevelStat {
  errors: number;
  time: number;
  stars: number;
}

export interface ProgressData {
  version: string;
  currentSubject: SubjectId;
  currentGrade: GradeId;
  currentUnit: number;
  currentLevel: number;
  unlockedLevels: Partial<Record<ProgressScopeKey, string[]>>;
  levelStats: Partial<Record<ProgressScopeKey, Record<string, LevelStat>>>;
  settings: {
    sound: boolean;
  };
}
