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

AI (Gemini) Question Page

1. Duplicate `.env.example` to `.env.local` (this file is ignored by git) and add your real key:

```env
GEMINI_API_KEY=your_real_key_here
```

2. Start dev server again if already running so Next.js loads the env.

3. Visit `/questionai` to ask questions. The API key is only used on the server via the internal route `/api/ai/generate` (hidden from browser code).

Production env strategy

- You can commit `.env.production` now (repo configured to allow that) but ONLY if this repo is private.
- Vercel dashboard variables override any value in `.env.production` at build/deploy time.
- If the repo ever becomes public, immediately remove the real key and rotate it.

Security notes

- Do NOT expose the key with a variable starting with `NEXT_PUBLIC_`.
- All Gemini calls go through the server route, which also applies a very light in-memory rate limit (30 requests / 5 minutes per server instance).
- For production, consider a more robust rate-limiting (Redis, Upstash, etc.).

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
