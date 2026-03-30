import type { GradeId, GradeMeta, SubjectId, SubjectMeta, WordPair } from '@/types';

export const SUBJECT_META: SubjectMeta[] = [
  {
    id: 'chinese',
    name: '语文',
    icon: '📘',
    description: '汉字与拼音配对',
    leftLabel: '汉字',
    rightLabel: '拼音',
    victoryTitle: '本关生字'
  },
  {
    id: 'math',
    name: '数学',
    icon: '🧮',
    description: '算式与答案配对',
    leftLabel: '算式',
    rightLabel: '答案',
    victoryTitle: '本关算式'
  },
  {
    id: 'english',
    name: '英语',
    icon: '🔤',
    description: '英文与中文释义配对',
    leftLabel: '英文',
    rightLabel: '释义',
    victoryTitle: '本关单词'
  }
];

export const GRADE_META: GradeMeta[] = [
  { id: '一年级上册', name: '一年级', semester: '上册', units: 4 },
  { id: '一年级下册', name: '一年级', semester: '下册', units: 8 },
  { id: '二年级上册', name: '二年级', semester: '上册', units: 8 },
  { id: '二年级下册', name: '二年级', semester: '下册', units: 8 },
  { id: '三年级上册', name: '三年级', semester: '上册', units: 8 },
  { id: '三年级下册', name: '三年级', semester: '下册', units: 8 },
  { id: '四年级上册', name: '四年级', semester: '上册', units: 8 },
  { id: '四年级下册', name: '四年级', semester: '下册', units: 8 },
  { id: '五年级上册', name: '五年级', semester: '上册', units: 8 },
  { id: '五年级下册', name: '五年级', semester: '下册', units: 8 },
  { id: '六年级上册', name: '六年级', semester: '上册', units: 8 },
  { id: '六年级下册', name: '六年级', semester: '下册', units: 8 }
];

export const UNIT_LEVEL_LAYOUT: Record<GradeId, number[]> = {
  一年级上册: [3, 2, 2, 2],
  一年级下册: [2, 2, 2, 2, 2, 2, 2, 2],
  二年级上册: [2, 2, 2, 2, 2, 2, 2, 2],
  二年级下册: [2, 2, 2, 2, 2, 2, 2, 2],
  三年级上册: [2, 2, 2, 2, 2, 2, 2, 2],
  三年级下册: [2, 2, 2, 2, 2, 2, 2, 2],
  四年级上册: [2, 2, 2, 2, 2, 2, 2, 2],
  四年级下册: [2, 2, 2, 2, 2, 2, 2, 2],
  五年级上册: [2, 2, 2, 2, 2, 2, 2, 2],
  五年级下册: [2, 2, 2, 2, 2, 2, 2, 2],
  六年级上册: [2, 2, 2, 2, 2, 2, 2, 2],
  六年级下册: [2, 2, 2, 2, 2, 2, 2, 2]
};

const CHINESE_POOL: WordPair[] = [
  { char: '天', pinyin: 'tian' }, { char: '地', pinyin: 'di' }, { char: '人', pinyin: 'ren' },
  { char: '你', pinyin: 'ni' }, { char: '我', pinyin: 'wo' }, { char: '他', pinyin: 'ta' },
  { char: '一', pinyin: 'yi' }, { char: '二', pinyin: 'er' }, { char: '三', pinyin: 'san' },
  { char: '四', pinyin: 'si' }, { char: '五', pinyin: 'wu' }, { char: '六', pinyin: 'liu' },
  { char: '七', pinyin: 'qi' }, { char: '八', pinyin: 'ba' }, { char: '九', pinyin: 'jiu' },
  { char: '十', pinyin: 'shi' }, { char: '日', pinyin: 'ri' }, { char: '月', pinyin: 'yue' },
  { char: '山', pinyin: 'shan' }, { char: '水', pinyin: 'shui' }, { char: '火', pinyin: 'huo' },
  { char: '木', pinyin: 'mu' }, { char: '田', pinyin: 'tian2' }, { char: '禾', pinyin: 'he' },
  { char: '风', pinyin: 'feng' }, { char: '雨', pinyin: 'yu' }, { char: '云', pinyin: 'yun' },
  { char: '雪', pinyin: 'xue' }, { char: '花', pinyin: 'hua' }, { char: '草', pinyin: 'cao' },
  { char: '树', pinyin: 'shu' }, { char: '鸟', pinyin: 'niao' }, { char: '虫', pinyin: 'chong' },
  { char: '春', pinyin: 'chun' }, { char: '夏', pinyin: 'xia' }, { char: '秋', pinyin: 'qiu' },
  { char: '冬', pinyin: 'dong' }, { char: '爸', pinyin: 'ba' }, { char: '妈', pinyin: 'ma' },
  { char: '爷', pinyin: 'ye' }, { char: '奶', pinyin: 'nai' }, { char: '家', pinyin: 'jia' },
  { char: '里', pinyin: 'li' }, { char: '来', pinyin: 'lai' }, { char: '去', pinyin: 'qu' },
  { char: '看', pinyin: 'kan' }, { char: '走', pinyin: 'zou' }, { char: '门', pinyin: 'men' },
  { char: '上', pinyin: 'shang' }, { char: '下', pinyin: 'xia4' }, { char: '左', pinyin: 'zuo' },
  { char: '右', pinyin: 'you' }, { char: '前', pinyin: 'qian' }, { char: '后', pinyin: 'hou' },
  { char: '东', pinyin: 'dong1' }, { char: '西', pinyin: 'xi' }, { char: '南', pinyin: 'nan' },
  { char: '北', pinyin: 'bei' }, { char: '高', pinyin: 'gao' }, { char: '低', pinyin: 'di1' },
  { char: '大', pinyin: 'da' }, { char: '小', pinyin: 'xiao' }, { char: '多', pinyin: 'duo' },
  { char: '少', pinyin: 'shao' }, { char: '好', pinyin: 'hao' }, { char: '坏', pinyin: 'huai' },
  { char: '早', pinyin: 'zao' }, { char: '晚', pinyin: 'wan' }, { char: '明', pinyin: 'ming' },
  { char: '暗', pinyin: 'an' }, { char: '快', pinyin: 'kuai' }, { char: '慢', pinyin: 'man' },
  { char: '笑', pinyin: 'xiao4' }, { char: '哭', pinyin: 'ku' }, { char: '听', pinyin: 'ting' },
  { char: '说', pinyin: 'shuo' }, { char: '读', pinyin: 'du' }, { char: '写', pinyin: 'xie' },
  { char: '学', pinyin: 'xue2' }, { char: '校', pinyin: 'xiao4' }, { char: '班', pinyin: 'ban' },
  { char: '同', pinyin: 'tong' }, { char: '友', pinyin: 'you3' }, { char: '师', pinyin: 'shi1' },
  { char: '生', pinyin: 'sheng' }, { char: '书', pinyin: 'shu1' }, { char: '本', pinyin: 'ben' },
  { char: '笔', pinyin: 'bi' }, { char: '纸', pinyin: 'zhi' }, { char: '桌', pinyin: 'zhuo' },
  { char: '椅', pinyin: 'yi3' }, { char: '窗', pinyin: 'chuang' }, { char: '灯', pinyin: 'deng' },
  { char: '星', pinyin: 'xing' }, { char: '空', pinyin: 'kong' }, { char: '海', pinyin: 'hai' },
  { char: '河', pinyin: 'he2' }, { char: '湖', pinyin: 'hu2' }, { char: '桥', pinyin: 'qiao' },
  { char: '船', pinyin: 'chuan' }, { char: '车', pinyin: 'che' }, { char: '路', pinyin: 'lu' },
  { char: '跑', pinyin: 'pao' }, { char: '跳', pinyin: 'tiao' }, { char: '坐', pinyin: 'zuo4' },
  { char: '站', pinyin: 'zhan' }, { char: '开', pinyin: 'kai' }, { char: '关', pinyin: 'guan' }
];

const ENGLISH_POOL: WordPair[] = [
  { char: 'apple', pinyin: '苹果' }, { char: 'banana', pinyin: '香蕉' }, { char: 'pear', pinyin: '梨' },
  { char: 'orange', pinyin: '橙子' }, { char: 'grape', pinyin: '葡萄' }, { char: 'peach', pinyin: '桃子' },
  { char: 'cat', pinyin: '猫' }, { char: 'dog', pinyin: '狗' }, { char: 'bird', pinyin: '鸟' },
  { char: 'fish', pinyin: '鱼' }, { char: 'rabbit', pinyin: '兔子' }, { char: 'tiger', pinyin: '老虎' },
  { char: 'lion', pinyin: '狮子' }, { char: 'panda', pinyin: '熊猫' }, { char: 'duck', pinyin: '鸭子' },
  { char: 'book', pinyin: '书' }, { char: 'pen', pinyin: '钢笔' }, { char: 'pencil', pinyin: '铅笔' },
  { char: 'bag', pinyin: '书包' }, { char: 'desk', pinyin: '书桌' }, { char: 'chair', pinyin: '椅子' },
  { char: 'window', pinyin: '窗户' }, { char: 'door', pinyin: '门' }, { char: 'classroom', pinyin: '教室' },
  { char: 'teacher', pinyin: '老师' }, { char: 'student', pinyin: '学生' }, { char: 'friend', pinyin: '朋友' },
  { char: 'mother', pinyin: '妈妈' }, { char: 'father', pinyin: '爸爸' }, { char: 'sister', pinyin: '姐姐' },
  { char: 'brother', pinyin: '哥哥' }, { char: 'grandma', pinyin: '奶奶' }, { char: 'grandpa', pinyin: '爷爷' },
  { char: 'red', pinyin: '红色' }, { char: 'blue', pinyin: '蓝色' }, { char: 'yellow', pinyin: '黄色' },
  { char: 'green', pinyin: '绿色' }, { char: 'black', pinyin: '黑色' }, { char: 'white', pinyin: '白色' },
  { char: 'one', pinyin: '一' }, { char: 'two', pinyin: '二' }, { char: 'three', pinyin: '三' },
  { char: 'four', pinyin: '四' }, { char: 'five', pinyin: '五' }, { char: 'six', pinyin: '六' },
  { char: 'seven', pinyin: '七' }, { char: 'eight', pinyin: '八' }, { char: 'nine', pinyin: '九' },
  { char: 'ten', pinyin: '十' }, { char: 'sun', pinyin: '太阳' }, { char: 'moon', pinyin: '月亮' },
  { char: 'star', pinyin: '星星' }, { char: 'sky', pinyin: '天空' }, { char: 'cloud', pinyin: '云' },
  { char: 'rain', pinyin: '雨' }, { char: 'snow', pinyin: '雪' }, { char: 'wind', pinyin: '风' },
  { char: 'spring', pinyin: '春天' }, { char: 'summer', pinyin: '夏天' }, { char: 'autumn', pinyin: '秋天' },
  { char: 'winter', pinyin: '冬天' }, { char: 'morning', pinyin: '早晨' }, { char: 'evening', pinyin: '傍晚' },
  { char: 'happy', pinyin: '开心的' }, { char: 'sad', pinyin: '伤心的' }, { char: 'fast', pinyin: '快的' },
  { char: 'slow', pinyin: '慢的' }, { char: 'big', pinyin: '大的' }, { char: 'small', pinyin: '小的' },
  { char: 'long', pinyin: '长的' }, { char: 'short', pinyin: '短的' }, { char: 'hot', pinyin: '热的' },
  { char: 'cold', pinyin: '冷的' }, { char: 'water', pinyin: '水' }, { char: 'milk', pinyin: '牛奶' },
  { char: 'bread', pinyin: '面包' }, { char: 'rice', pinyin: '米饭' }, { char: 'egg', pinyin: '鸡蛋' },
  { char: 'noodle', pinyin: '面条' }, { char: 'school', pinyin: '学校' }, { char: 'home', pinyin: '家' }
];

function createMathPool(): WordPair[] {
  const result: WordPair[] = [];

  for (let a = 2; a <= 30; a += 1) {
    for (let b = 1; b <= 12; b += 1) {
      result.push({ char: `${a} + ${b}`, pinyin: String(a + b) });
    }
  }

  for (let a = 6; a <= 40; a += 1) {
    for (let b = 1; b <= 12; b += 1) {
      if (a > b) {
        result.push({ char: `${a} - ${b}`, pinyin: String(a - b) });
      }
    }
  }

  for (let a = 2; a <= 12; a += 1) {
    for (let b = 2; b <= 12; b += 1) {
      result.push({ char: `${a} × ${b}`, pinyin: String(a * b) });
    }
  }

  for (let a = 2; a <= 12; a += 1) {
    for (let b = 2; b <= 12; b += 1) {
      result.push({ char: `${a * b} ÷ ${a}`, pinyin: String(b) });
    }
  }

  return result;
}

const SUBJECT_POOLS: Record<SubjectId, WordPair[]> = {
  chinese: CHINESE_POOL,
  math: createMathPool(),
  english: ENGLISH_POOL
};

function createEmptyGradeMap(): Record<GradeId, Record<number, WordPair[]>> {
  return {
    一年级上册: {},
    一年级下册: {},
    二年级上册: {},
    二年级下册: {},
    三年级上册: {},
    三年级下册: {},
    四年级上册: {},
    四年级下册: {},
    五年级上册: {},
    五年级下册: {},
    六年级上册: {},
    六年级下册: {}
  };
}

function createUnitWords(pool: WordPair[], seed: number, levelCount: number): WordPair[] {
  const total = levelCount * 12;
  const words: WordPair[] = [];
  const poolSize = pool.length;

  for (let i = 0; i < total; i += 1) {
    const index = (seed + i) % poolSize;
    const item = pool[index];
    words.push({ char: item.char, pinyin: item.pinyin });
  }

  return words;
}

function buildBookData(): Record<SubjectId, Record<GradeId, Record<number, WordPair[]>>> {
  const result: Record<SubjectId, Record<GradeId, Record<number, WordPair[]>>> = {
    chinese: createEmptyGradeMap(),
    math: createEmptyGradeMap(),
    english: createEmptyGradeMap()
  };

  const subjectSeedBase: Record<SubjectId, number> = {
    chinese: 0,
    math: 53,
    english: 101
  };

  for (const subject of SUBJECT_META) {
    const pool = SUBJECT_POOLS[subject.id];
    let seed = subjectSeedBase[subject.id];

    for (const grade of GRADE_META) {
      const layout = UNIT_LEVEL_LAYOUT[grade.id];
      for (let unit = 1; unit <= grade.units; unit += 1) {
        const levels = layout[unit - 1] ?? 2;
        result[subject.id][grade.id][unit] = createUnitWords(pool, seed, levels);
        seed += 11;
      }
    }
  }

  return result;
}

export const BOOK_DATA = buildBookData();
