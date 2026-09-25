# City Detective

A browser-based detective board game. You are a private detective working an
open city map: visit locations, search scenes for clues, question suspects,
keep a notebook, and make one accusation that has to hold up.

**First case: Thailand - Bangkok - "The Emerald Deva".**

## Play

Open `index.html` in any browser, or visit the GitHub Pages deployment of this
repo. No build step, no backend - plain HTML/CSS/JS with static assets.

- Visit every location to unlock the accusation.
- Search each scene; every clue lands in your notebook.
- Question the people you meet; some testimony is key evidence.
- Accuse the right suspect and answer the deduction questions to close the case.
- Progress saves automatically in your browser (localStorage).

## Adding a new country / case

The engine is data-driven. A case is a plain JavaScript object - no engine
changes needed.

1. Create `case-<id>.js` following the structure of `case-thailand.js`:
   - `suspects`: id, name, role, image, bio
   - `locations`: id, name, image, blurb, description, `searches` (clues),
     optional `person` (a suspect with questions/answers)
   - `culprit`, `deduction` (evidence questions), `winText`, `loseText`
2. Generate or add its images (16:9 scenes, 1:1 portraits) at repo root.
3. Register the case in `cases.js` and add its `<script>` tag to `index.html`.

## Assets

All artwork in this repo is AI-generated for this project (no copyrighted
material). The case, characters, and events are entirely fictional.

Inspired by the structure of online detective games like City Code
(citycodegame.com) - this is an original implementation with original content.
