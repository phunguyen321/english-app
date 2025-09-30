English Learner App (Next.js + MUI + Redux)

Features

- Vocabulary: topics, levels, flashcard study with custom range and shuffle.
- Grammar: core tenses and essential rules with short examples.
- Quizzes: 100+ ready to extend; MCQ vocab/grammar and sentence order; results with explanations.
- Mock data: JSON under `public/mock` (no backend required).

Run (Windows cmd)

```cmd
npm install
npm run dev
```

Open http://localhost:3000 and navigate via the top bar.

Data

- `public/mock/vocab.json`
- `public/mock/grammar.json`
- `public/mock/quizzes.json`

Add or update these JSON files to extend content.

Real 3000-word vocabulary

- Add your list to `scripts/data/english-words-3000.txt` (one word per line).
- Then regenerate the dataset:

```cmd
npm run generate:data
```

The generator will use your real words if available; otherwise it falls back to synthetic placeholders.
