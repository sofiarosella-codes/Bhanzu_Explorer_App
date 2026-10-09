# Bhanzu Math Explorer Club — version 3

Open **bhanzu-explorer.html** in a browser. This is the complete single-file app; no package installation, API key or internet connection is needed.

## What changed

- Choose **Grade 1–12** before starting. Returning users are asked to choose their grade while retaining their old completed-activity count.
- All **15 activities are open** before the saved class date. Weeks and days are suggested pacing, not locks. Use the activity dropdown, Previous/Next buttons or the full roadmap.
- **Save artwork to my passport** now saves the actual pixels, displays the artwork in the passport gallery and records completion. It works again after the activity was previously completed, without adding a duplicate stamp.
- Drawing drafts, game state, postcards, saved artwork and passport progress persist in this browser. Each grade has its own drafts and progress.
- Paintings can be downloaded as SVG images; postcards as text. The passport can be printed.
- Completing a game saves its stamp automatically. Creative work has an explicit Save button so edits do not silently replace the saved gallery version.
- Activities stop when the saved first-class date arrives. The artwork and passport remain available.

## Activities and grade design

The app contains 15 activities using 13 interaction types: personal badge painting, memory pairs, sequence dragging, number/fraction/percentage splitting, pixel symmetry, shopping budgets, colour-sequence memory, sorting, equation balance, function machines, route planning, intention postcards, cipher entry, poster painting and packing a class kit.

Grades share interaction types, with grade-dependent values and four content bands:

| Grades | Examples |
| --- | --- |
| 1–2 | Symbols, colours, counting, simple number splits and creative play |
| 3–5 | Addition pairs, skip-counting, grouping and shopping arithmetic |
| 6–8 | Fraction equivalence, geometric sequences, divisibility and equations |
| 9–12 | Consecutive squares, percentages, discounts, algebra and function experiments |

Creative activities adapt their wording and goals by band. Not every game has twelve completely different concepts. These are illustrative enrichment activities, not a verified curriculum or a claim about Bhanzu's official grade coverage. Academic review should tune the content to the actual learner groups.

## Saving and upgrading

Data uses the existing `bhanzu-explorer-v1` browser-storage key so previous profiles can migrate. A previous completed activity stays counted in the first grade selected. Old artwork cannot be recovered from version 2 because that version only kept drawing pixels in memory. New drafts and saved artwork persist independently: clearing a draft does not remove its last saved gallery version.

Data stays on one browser/device. A different browser, a copied file at a new location, or a hosted version may use a different storage area and start fresh. Clearing browser data removes saved content. If saving is blocked or storage is full, the app displays a warning. Use the same file location when updating an existing installation.

## Source files

- `index.html`: local multi-file entry point.
- `app.js`: grade selection, profile migration, passport/gallery, navigation and date cutoff.
- `curriculum.js`: grade-specific activity configurations.
- `studio.js`: interactive activities and draft persistence callbacks.
- `styles.css`, `games.css`, `studio.css`: layout and interactive styles.
- `engine.js`: legacy content plus date/profile helpers used for migration. Its old availability helper does not gate the version 3 activities.
- `games.js`: retained legacy version 2 implementation; not loaded by version 3.
- `build-bundle.cjs`: creates the single-file app from the source files.

Run `node build-bundle.cjs` after edits to update the distributable HTML.

Run unit checks with Node.js:

```sh
node --test --test-isolation=none tests.cjs grade-tests.cjs
```

The grade checks cover all 12 configurations, shopping affordability, numerical solutions and route reachability. Browser QA also exercises saving and re-saving artwork, reloads, grade switching, all 15 completions, mobile layouts and legacy migration.

## Scope

This is a local, self-guided prototype. It does not connect to Bhanzu enrolment data, record real attendance, sync across devices, send WhatsApp messages or contact staff. The first-class date is user-entered and follows the device's local calendar. The guide provides prepared hints, not AI chat or live support.
