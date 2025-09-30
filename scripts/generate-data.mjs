import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'mock');
fs.mkdirSync(outDir, { recursive: true });

// Try load real English words (one per line) from scripts/data/english-words-3000.txt
const dataDir = path.join(process.cwd(), 'scripts', 'data');
const wordsPath = path.join(dataDir, 'english-words-3000.txt');
let words = [];
if (fs.existsSync(wordsPath)) {
  const raw = fs.readFileSync(wordsPath, 'utf-8');
  words = raw
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter((w) => w && !w.startsWith('#'));
  // Keep unique and lowercase
  const seen = new Set();
  words = words.filter((w) => {
    const k = w.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Topics
const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const topicNames = [
  'Daily Life','Travel','Business','Technology','Health','Education','Food','Shopping','Nature','Sports',
  'Entertainment','Culture','Science','Work','Family','Friends','Weather','Art','Music','News'
];

const topics = topicNames.map((name, i) => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name, level: levels[Math.floor(i/4)] || 'B2' }));

// Build vocab entries from words list or fallback to synthetic
const targetCount = words.length >= 3000 ? 3000 : words.length || 3000;
const entries = [];
for (let i = 1; i <= targetCount; i++) {
  const w = words.length ? words[i - 1] : `word-${i}`;
  const topic = topics[i % topics.length];
  const level = levels[i % levels.length];
  entries.push({
    id: String(i),
    word: w,
    phonetic: undefined,
    meaningVi: `nghĩa của từ ${w}`,
    topicId: topic.id,
    level,
    examples: [
      { en: `I use ${w} every day.`, vi: `Tôi dùng từ ${w} mỗi ngày.` },
      { en: `This is an example with ${w}.`, vi: `Đây là ví dụ với ${w}.` }
    ]
  });
}

const vocab = { topics, entries };
fs.writeFileSync(path.join(outDir, 'vocab.json'), JSON.stringify(vocab, null, 2), 'utf-8');

// Grammar seed
const grammar = [
  {
    id: 'present-simple',
    title: 'Thì hiện tại đơn (Present Simple)',
    category: 'Tenses',
    brief: 'Dùng để diễn tả thói quen, sự thật hiển nhiên.',
    points: [
      { rule: 'S + V(s/es) (He/She/It)', example: { en: 'She works every day.', vi: 'Cô ấy làm việc mỗi ngày.' } },
      { rule: 'S + V (I/You/We/They)', example: { en: 'They play football.', vi: 'Họ chơi bóng đá.' } }
    ]
  },
  {
    id: 'present-continuous',
    title: 'Thì hiện tại tiếp diễn (Present Continuous)',
    category: 'Tenses',
    brief: 'Hành động đang xảy ra tại thời điểm nói.',
    points: [
      { rule: 'S + am/is/are + V-ing', example: { en: 'I am studying now.', vi: 'Tôi đang học bây giờ.' } }
    ]
  },
  {
    id: 'present-perfect',
    title: 'Thì hiện tại hoàn thành (Present Perfect)',
    category: 'Tenses',
    brief: 'Hành động đã xảy ra và còn ảnh hưởng hiện tại.',
    points: [
      { rule: 'S + have/has + V3', example: { en: 'I have finished my work.', vi: 'Tôi đã hoàn thành công việc.' } }
    ]
  }
];
fs.writeFileSync(path.join(outDir, 'grammar.json'), JSON.stringify(grammar, null, 2), 'utf-8');

// 120 quiz questions
const quizzes = [];
for (let i = 1; i <= 60; i++) {
  const w = entries[i * 5]?.word || `word-${i}`;
  quizzes.push({
    id: `v${i}`,
    type: 'vocab-mcq',
    difficulty: i <= 20 ? 'easy' : i <= 40 ? 'medium' : 'hard',
    prompt: `Nghĩa của từ '${w}' là gì?`,
    options: [
      `nghĩa sai 1 của ${w}`,
      `nghĩa của từ ${w}`,
      `nghĩa sai 2 của ${w}`,
      `nghĩa sai 3 của ${w}`
    ],
    answerIndex: 1,
    explanation: `Đáp án đúng là nghĩa chuẩn của ${w}.`
  });
}
for (let i = 1; i <= 40; i++) {
  quizzes.push({
    id: `g${i}`,
    type: 'grammar-mcq',
    difficulty: i <= 15 ? 'easy' : i <= 30 ? 'medium' : 'hard',
    prompt: 'Chọn câu đúng ở thì hiện tại đơn:',
    options: ['She work every day.', 'She works every day.', 'She is work every day.', 'She working every day.'],
    answerIndex: 1,
    explanation: 'He/She/It + V(s/es) trong thì hiện tại đơn.'
  });
}
for (let i = 1; i <= 20; i++) {
  quizzes.push({
    id: `s${i}`,
    type: 'sentence-order',
    difficulty: i <= 7 ? 'easy' : i <= 14 ? 'medium' : 'hard',
    tokens: ['I', 'am', 'studying', 'now'],
    answer: 'I am studying now',
    explanation: 'Cấu trúc: S + am/is/are + V-ing.'
  });
}
fs.writeFileSync(path.join(outDir, 'quizzes.json'), JSON.stringify(quizzes, null, 2), 'utf-8');

console.log('Mock data generated:', {
  topics: topics.length,
  entries: entries.length,
  sourceWords: words.length,
  grammarTopics: grammar.length,
  quizzes: quizzes.length,
});
if (!words.length) {
  console.warn('\n[Note] No real-word list found. Fallback to synthetic words.');
  console.warn('To use real English words, add one per line to:');
  console.warn('  scripts/data/english-words-3000.txt');
}
