# HSK Master

Exam preparation for the 2025 HSK 3.0 syllabus (新版HSK考试大纲): HSK 1–6 and 7–9, as an installable web app with English and Russian explanations.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npx playwright test  # end-to-end tests on desktop, tablet and phone (needs a production build)
```

## What's in phase 1

| Module | Status |
| --- | --- |
| Language choice (English / Russian), switchable on every page | Done |
| Dashboard with HSK 1–6 and 7–9 | Done |
| Lessons: official words with hanzi, pinyin, audio, meanings, measure words, traditional forms | Done for all levels (11,105 entries, 358 lessons) |
| Flashcards with spaced review (Leitner boxes) | Done |
| Lesson tests (meaning, characters, pinyin with tone distractors) | Done |
| Grammar | Official grammar list for every level (593 items), each with an explanation, examples within the level's vocabulary and common mistakes (en + ru) |
| Writing on a 田字格 grid: stroke-order animation, stroke-by-stroke checking (touch, pen, mouse) | Done for all 3,088 characters |
| Pinyin tone exercise with pitch contours | Done |
| Random practice per level (flashcards and tests, recent words held back) | Done |
| Graded sentence bank (Tatoeba): 1,200–3,000 sentences per level | Done |
| Listening: true/false, sentence heard, word heard, with sound-alike options and transcripts | Done (device text-to-speech) |
| Reading & writing: fill the gap, word order, sentence meaning, arrange words, type the missing character | Done |
| Speaking: read aloud and listen-and-repeat, checked per character by speech recognition (recorder fallback) | Done; AI coach below |
| Timed mock exam per level with section scores and mistake review | Done (essays, translation and the HSKK oral test are not scored) |
| Exam readiness overview on each level page | Done |
| Accounts and sync (Supabase) | Built; switches on when the Supabase keys are set (see Setup) |
| AI speaking coach (Claude) | Built; switches on when `ANTHROPIC_API_KEY` is set. Includes HSKK-style "answer a question" practice |
| Offline / installable (PWA) | Done (manifest + service worker) |

English and Russian meanings and pinyin are hand-checked for HSK 1–2 (504 entries). Higher levels use CC-CEDICT English senses (marked "EN" in Russian mode) and dictionary pinyin chosen to agree with pypinyin; both still need review.

## Project layout

```
src/app/[locale]/…              pages (statically generated for en and ru)
src/components/                 UI; lesson/ (word list, flashcards, test), writing/ (pad, tone drill)
src/lib/i18n/en.ts, ru.ts       every UI string, typed so both languages stay complete
src/lib/progress.ts             on-device progress (spaced review, tests, writing), records carry updatedAt for sync
src/lib/settings.ts             language, theme, tone colours
src/data/hsk3/level-N.json      generated vocabulary (7 = levels 7–9)
src/data/grammar/               detailed notes (en + ru) and the official syllabus grammar lists
public/hanzi/<codepoint>.json   stroke data for Hanzi Writer
scripts/build-vocab.py          rebuilds src/data from the source word lists
scripts/glosses/hsk3-N.tsv      curated pinyin, English and Russian meanings
tests/app.spec.ts               Playwright + axe-core tests
```

## Rebuilding the vocabulary

Put these in one folder: `k25/w{1..6,7-9}.txt` (krmanik/HSK-3.0-words-list, `New HSK (2025)/HSK Words`), `ced/package/cedict.json` (npm `cedict-json`), `complete.json` (drkameleon/complete-hsk-vocabulary, frequency ranks). Then:

```bash
pip install pypinyin
python3 scripts/build-vocab.py <folder>
```

## Sources and licences

- Word and grammar lists: official 2025 HSK syllabus (新版HSK考试大纲), as transcribed in [krmanik/HSK-3.0-words-list](https://github.com/krmanik/HSK-3.0-words-list)
- Pinyin, dictionary senses, traditional forms, measure words: [CC-CEDICT](https://cc-cedict.org) (CC BY-SA 4.0); readings checked against [pypinyin](https://github.com/mozillazg/python-pinyin) (MIT)
- Frequency ranks for lesson order: [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (MIT)
- Stroke data: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) via [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) (Arphic Public License); engine [Hanzi Writer](https://github.com/chanind/hanzi-writer) (MIT)
- Example sentences: [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR) via the npm package `tatoeba-sentence-pairs-in-mandarin-chinese-english`, graded by `scripts/build-sentences.py` so each level uses only its own and lower-level words
- Grammar explanations, example sentences and curated meanings: written for this project.
- Past HSK papers and recordings are copyrighted by CTI and are not included. Listening questions will be original, in the official formats.

## Setup for the AI coach and accounts

Both features are off until their keys are set; everything else works without them. See `.env.example`.

1. **AI coach.** Create a key at console.anthropic.com (Settings → API keys) and set `ANTHROPIC_API_KEY` on the server. The coach uses `claude-opus-5-5` by default; set `COACH_MODEL=claude-haiku-5-5` to cut the cost to a few cents a month. The coach reads the speech-recognition transcript, so it judges grammar, word choice and likely tone errors from mis-recognised characters; it does not hear the audio. Requests use server-side refusal fallbacks (`fallbacks: "default"`).
2. **Accounts and sync.** Create a Supabase project, run `supabase/schema.sql` in its SQL editor, and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Sign-in appears under Settings. Progress merges per word, character and test (newest record wins). When Supabase is configured, only signed-in users can call the AI coach; without it, the coach is rate-limited per address.
3. **Deploy.** Import the repository into Vercel and add the variables above. `npm run build` is the build command.
