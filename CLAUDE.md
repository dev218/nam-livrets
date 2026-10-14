# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Math Talk": a single-file, dependency-free web app (`index.html`) that quizzes a child on times tables or subtraction by voice. The page speaks the question (Web Speech `speechSynthesis`), listens for the answer (`webkitSpeechRecognition`), and falls back to typed input. It targets Safari on iPhone; the only external resource is the Fredoka font from Google Fonts.

## Running

There is no build, package manager, linter, or test suite. Edit `index.html` and reload.

- Quick check: open `index.html` directly in a browser.
- Microphone testing: serve over HTTP (e.g. `python3 -m http.server 8000`) and open on an iPhone in Safari. Speech recognition is blocked in iframes and is only available in Safari/WebKit; desktop Chrome has `SpeechRecognition` but behaves differently.
- Settings live in `localStorage` under the `ttt2_` prefix. Clear them to reset to defaults (15 questions, tables up to 9, `fr-CH`, 5 subtraction questions, 2-digit first operand, 1-digit second operand).

## Code structure (all inside one IIFE in `index.html`)

**Screens.** Four `<section class="screen">` elements (`s-home`, `s-setup`, `s-quiz`, `s-result`); `show(id)` toggles the `on` class. Markup is plain HTML; CSS theme is CSS variables on `:root`, with a dark variant under both `prefers-color-scheme: dark` and `[data-theme="dark"]`.

**Modes.** `S.mode` is `"mul"` or `"sub"`. Everything mode-specific goes through four dispatch helpers: `answerOf(q)`, `opSign()`, `askText(P, q)`, `revealText(P, q, r)`. Questions are `[a, b]` pairs; generators are `makeQuestions` (shuffled full table pool, operands randomly swapped) and `makeSubQuestions` (first operand random with up to `subDigits1` digits, second operand random with up to `subDigits2` digits and strictly smaller). Adding an operation means: a home button, a setup fieldset, new `ask*`/`reveal*` keys in every language pack, a generator, and a branch in each dispatch helper plus `startQuiz`.

**Language packs.** `T` is keyed by BCP‑47 tag (`en-US`, `fr-FR`, `vi-VN`; `fr-CH` aliases `fr-FR`). Each pack holds the spoken prompts and the short UI status strings. Spoken-number parsing is separate: `parseSpoken` tries digits first, then `wordsToNumber`, which has per-language word tables (`EN`, `FR`, `VI`) and language-specific composition rules (French `quatre-vingt(s)` and Swiss `septante/huitante/nonante`; Vietnamese `mươi`/`mười` handling). Adding a language requires an `<option>` in `#lang`, a pack in `T`, and a parsing branch.

**Cancellation.** `run` is a global counter. Every async flow captures `var my = run` and checks `if (my !== run) return` after each `await`. Quit, Skip, Start, and the mic button bump `run` to abandon in-flight speech/recognition. Preserve this pattern in any new async code or stale callbacks will act on the wrong question.

**Quiz loop.** `askCurrent` → `speak` → `listen` → `handleHeard` → `judge` → `nextQuestion`/`finish`. Recognition requests up to 5 alternatives and the answer is correct if any alternative parses to the right number. Two wrong attempts reveal the answer and move on; three silent recognition ends stop auto-relistening and wait for a mic tap. Only first-try correct answers count toward `score`; anything else goes to `misses`, which are deduped on the result screen.

**iOS audio constraints.** `unlockAudio()` creates/resumes the `AudioContext` and must be called from a user gesture before any tone plays. `startQuiz` also speaks a silent utterance to warm up TTS. `speak()` resolves on a 7 s guard timer because `onend` is unreliable on iOS.
