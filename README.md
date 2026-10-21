# HSK Master

Exam preparation for HSK 1–6 (HSK 2.0 standard) as an installable web app. English and Russian explanations.

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
| Dashboard with HSK 1–6 | Done |
| Lessons: official words with hanzi, pinyin, audio, meanings, measure words, traditional forms | Done for all 6 levels (5,000 words, 233 lessons) |
| Flashcards with spaced review (Leitner boxes) | Done |
| Lesson tests (meaning, characters, pinyin with tone distractors) | Done |
| Grammar | HSK 1 done (14 points); HSK 2–6 to write |
| Writing on a 田字格 grid: stroke-order animation, stroke-by-stroke checking (touch, pen, mouse) | Done for all 2,632 characters |
| Pinyin tone exercise with pitch contours | Done |
| Listening (exam formats) | Planned, page describes the formats |
| Speaking & HSKK coach (AI) | Planned |
| Accounts and sync (Supabase) | Planned; progress is stored on the device in a sync-ready shape |
| Offline / installable (PWA) | Done (manifest + service worker) |

Russian meanings are written for HSK 1–2. HSK 3–6 show English meanings marked "EN" until translations are added.

## Project layout

```
src/app/[locale]/…              pages (statically generated for en and ru)
src/components/                 UI; lesson/ (word list, flashcards, test), writing/ (pad, tone drill)
src/lib/i18n/en.ts, ru.ts       every UI string, typed so both languages stay complete
src/lib/progress.ts             on-device progress (spaced review, tests, writing), records carry updatedAt for sync
src/lib/settings.ts             language, theme, tone colours
src/data/hsk2/level-N.json      generated vocabulary
src/data/grammar/               grammar points (en + ru)
public/hanzi/<codepoint>.json   stroke data for Hanzi Writer
scripts/build-vocab.py          rebuilds src/data from the source word lists
scripts/glosses/hsk2-N.tsv      curated English + Russian meanings
tests/app.spec.ts               Playwright + axe-core tests
```

## Rebuilding the vocabulary

Download the source lists into one folder (`clem-N.json` from clem109/hsk-vocabulary `hsk-vocab-json/hsk-level-N.json`, `old-N.json` from drkameleon/complete-hsk-vocabulary `wordlists/exclusive/old/N.json`), then:

```bash
python3 scripts/build-vocab.py <folder>
```

## Sources and licences

- HSK 2.0 word lists with syllabus pinyin: [clem109/hsk-vocabulary](https://github.com/clem109/hsk-vocabulary) (MIT)
- Dictionary senses, traditional forms, measure words: [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (MIT), built on CC-CEDICT (CC BY-SA 4.0)
- Stroke data: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) via [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) (Arphic Public License); engine [Hanzi Writer](https://github.com/chanind/hanzi-writer) (MIT)
- Grammar explanations, example sentences and curated meanings: written for this project.
- Past HSK papers and recordings are copyrighted by CTI and are not included. Listening questions will be original, in the official formats.
