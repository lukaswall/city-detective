# City Detective

A cinematic browser detective game. You work an open city map: search real
scenes for evidence through interactive hotspots, question suspects, pin it
all to a case board, and make one accusation you have to back with your own
evidence.

**First case: Thailand - Bangkok - "The Emerald Deva".**

## Play

Open `index.html` in any browser, or visit the GitHub Pages deployment of
this repo. No build step, no backend - plain HTML/CSS/JS with static assets.

- Visit every location to unlock the accusation.
- Evidence hides inside the scene photographs: open the gold markers.
  Dim markers are atmosphere - worth your time, not proof.
- Question the people you meet; some testimony is key evidence.
- The case board ties related evidence together with string. Read the knots.
- Accuse the right suspect, answer for the method, and present the two
  pieces of evidence that convict. Three mistakes and the case falls apart.
- Progress saves automatically in your browser.

## Play together (no server)

Two detectives, one case - built for a couple sharing a mystery.

- **Live co-op:** one detective hosts, the other joins, and you trade short
  invite/answer codes over any chat app. The browsers connect directly
  (WebRTC data channel, copy-paste signaling - no accounts, no backend).
  From then on every clue either of you finds lands on both screens, and the
  case closes for both at once.
- **Progress links:** the whole case state packs into a URL. Send it, and
  your partner merges your notebook into theirs on open. State always merges
  as a union - nobody's work is ever lost.

## Adding a new country / case

The engine is data-driven. A case is a plain JavaScript object - no engine
changes needed.

1. Create `case-<id>.js` following the structure of `case-thailand.js`:
   - `suspects`: id, name, role, image, bio
   - `locations`: id, name, time, image, blurb, description, `map` (x/y on
     the city map), `searches` (evidence with `x`/`y` hotspot coordinates as
     % of the scene image), `flavor` (optional atmosphere details, same
     coordinates), optional `person` (a suspect with questions/answers;
     `clueId` on a question files it as testimony)
   - `links`: pairs of clue ids whose relationship is drawn on the case board
   - `culprit`, `evidenceAnswer` (the two convicting clue ids),
     `evidenceHint`, `deduction` (method questions), `winText`, `loseText`
2. Add its images (16:9 scenes, 1:1 portraits) at repo root.
3. Register the case in `cases.js` and add its `<script>` tag to `index.html`.

## Assets

All artwork in this repo is AI-generated for this project (no copyrighted
material). The case, characters, and events are entirely fictional.
