import { pinyin } from 'pinyin-pro';
const MARKED_REGEX = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i;
function applyTone(syllable, tone) {
    if (tone <= 0 || tone > 4) {
        return syllable;
    }
    let base = syllable.toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü');
    const vowels = ['a', 'o', 'e', 'i', 'u', 'ü'];
    const toneTable = {
        a: ['a', 'ā', 'á', 'ǎ', 'à'],
        o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
        e: ['e', 'ē', 'é', 'ě', 'è'],
        i: ['i', 'ī', 'í', 'ǐ', 'ì'],
        u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
        ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ']
    };
    let index = -1;
    if (base.includes('a')) {
        index = base.indexOf('a');
    }
    else if (base.includes('e')) {
        index = base.indexOf('e');
    }
    else if (base.includes('ou')) {
        index = base.indexOf('o');
    }
    else {
        for (let i = base.length - 1; i >= 0; i -= 1) {
            if (vowels.includes(base[i])) {
                index = i;
                break;
            }
        }
    }
    if (index < 0) {
        return base;
    }
    const vowel = base[index];
    const marked = toneTable[vowel]?.[tone] ?? vowel;
    base = `${base.slice(0, index)}${marked}${base.slice(index + 1)}`;
    return base;
}
function numericToMarked(raw) {
    return raw.replace(/([a-züv:]+)([1-5])/gi, (_, syllable, toneNum) => {
        const tone = Number.parseInt(toneNum, 10);
        if (tone === 5) {
            return syllable.toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü');
        }
        return applyTone(syllable, tone);
    });
}
export function displayPinyin(rawPinyin, hanzi) {
    const trimmed = rawPinyin.trim();
    if (!trimmed) {
        return '';
    }
    if (MARKED_REGEX.test(trimmed)) {
        return trimmed;
    }
    if (/\d/.test(trimmed)) {
        return numericToMarked(trimmed);
    }
    try {
        const guessed = pinyin(hanzi, { toneType: 'symbol', type: 'array' });
        if (Array.isArray(guessed) && guessed[0]) {
            return guessed[0].toLowerCase();
        }
    }
    catch {
        // ignore and fallback
    }
    return trimmed;
}
