# ET617 End-semester Report — WireLab: The Mystery Wire

> Legend: **[VERIFIED]** = checked by running the build/app. **[PLANNED]** = evaluation design, not yet run with learners. **[FILL]** = slot for the student to complete.

## Identity card
| Field | Value |
|---|---|
| Roll number | 24B3926 |
| Card | P5 Inquiry-based virtual laboratory · P5-T4 Electrical resistance: length, area, material (Class 10) · L5 repeating learner, high anxiety, low self-efficacy · C4 ≤ 10-minute sequence with stop/resume |
| App | WireLab: The Mystery Wire |
| Live URL | https://et617-24b3926.vercel.app **[VERIFIED: HTTP 200, roll number present]** |
| Repository | https://github.com/MaitreyeeMar/et617-endsem-24b3926 |
| Stack | Next.js 16 + TypeScript + plain CSS, deployed on Vercel |

## D1 — Educational problem and learner
Aarya, 15, Class 10, can read an ammeter and use V = IR. Aarya failed a resistance question, hesitates to guess publicly, reads simple English, and revises on a shared Android phone after dinner. Two misconceptions are targeted:
1. "A longer wire draws more current because it has more conducting material."
2. "A thicker wire has more resistance because there is more material in the way."

The problem is not computation; it is reasoning *from evidence* about one property at a time. A private bench where predictions can be wrong without an audience suits an anxious, repeating learner.

## D2 — Learning outcomes
- **LO1:** Predict the direction of current change in two fresh controlled trials.
- **LO2:** Construct a pair of trials that isolates one wire property and identify what stayed fixed.
- **LO3:** Build a double-length wire that matches the reference current, and use readings from two trials to explain why it works.

## D3 — Design rationale (inquiry, feedback, anxiety)
- **Opens with the instrument:** the challenge "Your replacement wire must be twice as long. Can you keep the current meter at the same reading?" is shown with both rigs.
- **Predict → test → compare → revise** cycle. Branching on prediction plus stated reason:
  - correct + sound reason → independent test;
  - correct + uncertain reason → a short evidence question;
  - wrong prediction or misconception → the targeted question "Which wire gave the higher reading? What stayed the same?", then **Revise claim**.
- **Equation delayed:** R = ρ × L / A appears only after the first comparison has been observed.
- **Anxiety supports:**
  - private retries;
  - optional clues;
  - a calm "Task n of 5" indicator;
  - no countdown, leaderboard or score;
  - failed runs kept as data rather than marked wrong;
  - the worked answer withheld until the learner has failed twice *and* chosen a next property to test.
- **Phone-first layout:** stacked rigs, a single primary action fixed at the bottom, and large meters.
- **Accessibility:** native radio and checkbox controls (keyboard operable), labelled SVG diagrams, and an `aria-live` text equivalent for every control change.

## D4 — Implementation (URL, screen map)
**URL:** https://et617-24b3926.vercel.app

```
Guided (default)
 ├─ Opening: challenge + both rigs → Start Task 1
 ├─ Task 1 Length      predict+reason → Test wire → Compare trials → Revise claim → formula
 ├─ Task 2 Area        predict+reason → Test wire → Compare trials (end views) → Revise claim
 ├─ Task 3 Material    test Cu & NiCr same size → select trial pair → claim
 ├─ Task 4 Fair test   judge confounded G1/G2 → repair with a length-only run
 ├─ Task 5 Mystery     hypothesis → retries (failed runs kept) → evidence pair → explanation (AI/built-in)
 ├─ Transfer           2 predictions, unfamiliar settings (aluminium, copper)
 └─ Summary            transfer score, runs, active time
Free Bench   lock properties · pin reference · compare two runs
Lab Notebook trial table · select 2 as evidence · original vs revised explanations
About        roll number, assumptions, model, data note
Every screen: footer "WireLab · ET617 · Roll no. 24B3926", Save & leave, New attempt
```
- **Model:** V = 0.10 V; ρ: Cu 0.017, Al 0.028, NiCr 1.10 Ω·mm²/m; L ∈ {0.5, 1, 1.5, 2} m; A ∈ {0.25, 0.5, 0.75, 1} mm².
- **Live workbench (v2):** R = ρL/A as a stacked fraction above one large illustrated wire. Each symbol grows or shrinks with its slider within a modest range, and R grows with the calculated resistance. The formula's space is reserved, so it never moves.
- **Three keyboard-operable sliders:**
  - material/ρ, with stops for copper, aluminium and nichrome, showing the actual ρ;
  - L from 0.50 to 2.00 m in steps of 0.05, which moves the right clip;
  - A from 0.25 to 1.00 mm² in steps of 0.05; wire thickness and the end face scale with √A.
- **Meter and flow cue:** one live meter. Dots cross a fixed marker on the circuit lead at a rate proportional to current (1.5 dots/s at 45.45 mA), capped and labelled for the very large copper and aluminium currents. A pause button is provided, and the cue is paused by default under reduced-motion settings.
- **Reference:** a dashed outline of the reference wire stays visible on top of the live wire.
- **Saving:** dragging is a live preview only. **Save trial** records one notebook entry.
- **Guided unlocking:** each task unlocks only the relevant slider after the prediction is saved. In the final challenge the learner first stretches the wire to 2.00 m, then chooses which property's slider to unlock to restore the current.

Screenshots of the live app: **[FILL: opening screen]**, **[FILL: Task 1 misconception compare]**, **[FILL: mystery failed run + "Which property could you test next?"]**, **[FILL: notebook]**, **[FILL: phone layout]**

## D5 — Verification
| Check | Result |
|---|---|
| `npm run build` (production) | **[VERIFIED]** passes |
| Reference nichrome 1.00 m, 0.50 mm² | **[VERIFIED]** 2.20 Ω, 45.4545 mA |
| Double length only | **[VERIFIED]** 4.40 Ω, 22.7273 mA |
| Double length and area | **[VERIFIED]** 2.20 Ω, 45.4545 mA; unrounded match = true |
| Length misconception branch (predict "up" + "more metal") | **[VERIFIED]** 45.45 → 22.73 mA, both visible; asks "Which wire gave the higher reading? What stayed the same?" → Revise claim → formula revealed |
| Area misconception branch (predict "down" + "in the way") | **[VERIFIED]** 45.45 → 90.91 mA; same targeted compare question |
| Correct path (predict "down" + "longer path") | **[VERIFIED]** goes to an independent test, then "Your prediction matched the meter" |
| Material task | **[VERIFIED]** unequal copper trial rejected; confounded pair rejected ("differ in length"); Cu vs NiCr same size accepted; wrong claim nudged |
| Fair-test task | **[VERIFIED]** "Yes" nudged; a repair that also changed material rejected; length-only repair accepted (45.45 → 30.30 mA) |
| Mystery failed run | **[VERIFIED]** 22.73 mA "too low" + "Keep your new length. Which property could you test next?"; failed runs listed; worked answer only after 2 fails + a choice; area 1.00 mm² matches |
| Refresh after changing the wire, before Test (v1) | **[VERIFIED]** draft (area 1.00) restored; previous reading 22.73 mA restored as "Last reading (#1)" with "Ready to test"; saved prediction restored |
| v2 live sliders: NiCr 1.00 m / 0.50 mm² | **[VERIFIED]** 45.45 mA, flow 1.50 dots/s |
| v2 slide L → 2.00 m (20 keyboard steps) | **[VERIFIED]** 22.73 mA live; flow 0.75 dots/s (measured 0.75 crossings/s on screen); notebook still held only REF (no entries from dragging) |
| v2 slide A → 1.00 mm² (final challenge) | **[VERIFIED]** back to 45.45 mA, "Same as reference", flow 1.50 dots/s; longer, thicker wire shown over the dashed reference outline |
| v2 formula stability | **[VERIFIED]** fraction bar did not move while symbols rescaled |
| v2 resume | **[VERIFIED]** refresh restored slider positions (L 2.00, A 1.00), unlocked sliders and live reading |
| v2 misconception feedback after Save trial | **[VERIFIED]** length ("…because it has more metal… lower… half the rate") and area ("…more material is in the way… higher… twice as fast") |
| v3 focused layout at 360 px (area task, light + dark) | **[VERIFIED]** while dragging, wire (197–310 px), end face, slider and live meter (486–520 px) all sit above the action bar (666 px); fixed properties shown as one line "Fixed: Nichrome (ρ 1.10) · L 1.00 m"; Free Bench keeps all 3 sliders |
| v3 "Original wire / My trial" switch (area task) | **[VERIFIED]** light + dark: Original 45.45 mA, 1.50 dots/s, thickness 15.56 px, end-face r 21.21; My trial 90.91 mA, 3.00 dots/s, thickness 22 px, r 30 (area ratio 2.00); length scale and marker unchanged; bars show both currents; no notebook entries; slider draft unchanged |
| v3 observation before conclusion | **[VERIFIED]** after Save trial only a prompt to use the switch appears; the conclusion shows after the observation question is answered; area clue 1 = "Watch how many dots pass the marker." |
| v3 theme | **[VERIFIED]** toggle is keyboard-operable (Enter), defaults to the device setting, override persisted (`wirelab-theme`) and applied before first paint; reload after toggling kept task, answers, trials and the switch view; reduced motion starts with the flow paused |
| Optional Notebook "Mystery Wire" — equal currents | **[VERIFIED]** both cases (NiCr 2.00 m / 0.50 mm², and NiCr 1.00 m / 0.25 mm²) give R = 4.40 Ω and 22.7273 mA, identical (`currentsMatch` true), against the original 45.45 mA |
| Mystery Wire — no answer leak | **[VERIFIED]** before inspection the page (text and attributes) contains no mystery length, area, R or formula substitution; case ids are neutral (X/Y) and the case order is random |
| Mystery Wire — branches | **[VERIFIED]** "I need another observation" → inspect; a length or area guess is acknowledged as possible and the learner is invited to inspect; the ruler and end-face views show both wires on one scale; a meter-only observation and a wrong claim are both refused; the correct claim plus observation is saved (Notebook "Mystery Wire claims" table, including revise attempts); "Try the other mystery" opens case 2 |
| Mystery Wire — mobile, themes, resume | **[VERIFIED]** 360 px light and dark, no horizontal scroll (also fixed a notebook-table overflow); reload restored inspected evidence and stage; the Guided index was unaffected |
| **v5 Path A** sound reasoning → independent test (production build, 360 px, light) | **[VERIFIED]** "down" + "longer path" opens a plan step ("which properties will you keep the same?"). Ticking Length was refused ("If you keep the length the same, you cannot see what it does"); Material + Area was accepted. All three sliders opened; the reading went 45.45 → 22.73 mA live; Save trial. The observation question "Which wire carried more current?" showed full answer labels, and the button read "Choose an answer" (disabled) until a choice, then "Check my answer". Switching to Original showed 45.45 mA with no answer selected or graded. Correct answer → "Your prediction matched what you saw" + explanation → fresh copper prediction answered before its result |
| **v5 Path B** longer-wire misconception (360 px, dark) | **[VERIFIED]** prediction "up" + "A longer wire carries more current…" saved before any trial (branch = misconception, still 1 notebook trial). Only the length slider was shown ("Same material (nichrome) and thickness (0.50 mm²)."), ruler highlighted. While dragging, wire, slider, live meter and Save trial were all on one 740 px screen. Observation → "What would you change about your explanation?" → learner's own words (starter optional; blanks block saving) → explanation + built-in follow-up (supported_reasoning) → fresh prediction (answered wrong on purpose → "Not this time" + exact readings) |
| **v5 Path C** thicker-wire misconception (360 px, light) | **[VERIFIED]** "down" + "A thicker wire makes it harder for current to pass…" → only the area slider shown, with the first-use line "Cross-sectional area is the area of the wire's circular end." and the circular end highlighted → 45.45 → 90.91 mA → observation → revision → fresh aluminium prediction correct |
| **v5 Path D** repeated difficulty / requested help | **[VERIFIED]** 1st miss: "Look at the two saved meter readings. Original wire: 45.45 mA. My test wire: 90.91 mA…" (no bars). 2nd miss: bars on one scale + "Which bar is longer?"; a wrong bar answer is nudged; the right one returns to "Which wire carried more current?" with no answer preselected. Separately, "I'd like more help" with zero misses showed the same simpler prompt and left branch = misconception (a help request does not relabel the learner) |
| **v5 Path E** refresh mid-task | **[VERIFIED]** refresh mid-drag restored area 0.75 mm², live 68.18 mA and the saved prediction; refresh at the support stage restored "Which bar is longer?", bars, support = 2, misses = 2, prediction and trial count |
| v5 baselines in the normal flow | **[VERIFIED]** 45.45 mA (start), 22.73 mA (length 2.00 m), 90.91 mA (area 1.00 mm² alone) |
| v5 reduced motion | **[VERIFIED]** dots start paused; observe step shows "Static comparison — Original wire 45.45 mA · My test wire 90.91 mA"; highlight animation off (static ring) |
| v5 Notebook | **[VERIFIED]** one row shows the original prediction and reason, "45.45 → 22.73 mA (#1)", the revised explanation and the fresh prediction |
| v5 layout | **[VERIFIED]** 360 px and 1280 px, light and dark, no horizontal scroll; identity footer present; Start Task 1 sits in the challenge panel above the locked sliders |
| End view area doubles | **[VERIFIED]** radius 24.04 → 34 px, area ratio 2.000 |
| Narrow mobile (375 px) | **[VERIFIED]** rigs stacked, no horizontal scroll, primary action fixed at bottom |
| AI fallback | **[VERIFIED]** live endpoint returns `missing_key`; UI shows "Using built-in feedback" with a trial-specific prompt |
| Live AI classification | **NOT TESTED** — no API key configured |

### Not yet verified (v5)
- **10-minute timing:** whether the five-task mission fits in 10 minutes with a real Class 10 learner. My scripted runs are not timing evidence.
- **Live AI classification:** no API key is configured, so every follow-up above came from the built-in fallback.
- **Screen readers:** no test with a real screen reader. Keyboard operation was exercised (arrow keys on sliders and the view switch, Enter on buttons).
- **Older saved attempts:** an attempt saved before v5 resumes from its own stage and uses the "done"/"result" fallback. This was not separately exercised.
- **Live app:** the evidence below is from the local production build; the live site is checked after deployment.

**Captured evidence (local production build):** `docs/evidence/01`–`12` — opening; misconception path (prediction, controlled trial, observation, first miss, bars + simpler question, learner revision, fresh prediction); correct path (independent test, explanation); Notebook; desktop.

## D6 — Bounded AI feature
See README "AI feature" for the call, prompt, schema and checks. In summary:
- **What it does:** classifies the learner's revised claim or mystery explanation into one of 5 categories and maps that to an authored follow-up question.
- **What stays local:** the model never computes current or judges success. The server recomputes the physics and rejects any output whose stated changed variables disagree with the real trials.
- **Fallback:** on a missing key, timeout, invalid response or inconsistency, the app shows "Using built-in feedback" and continues.
- **Path actually tested:** the fallback (`missing_key`), both locally and live. The live-model path is implemented but unobserved. **[FILL if you add a key: observed request/response]**

## D7 — Persistence and resume (C4)
- **What is saved:** the whole state goes to localStorage after every action — task, stage, draft settings, last tested settings, trials, prediction, explanation drafts, locks, pinned reference, clues shown and notebook evidence.
- **Save & leave:** shows where the learner will resume.
- **New attempt:** clears progress after a confirmation.
- **Active time:** tracked while the page is visible, which gives the observed duration.

## D8 — Evaluation plan: outcome → assessment → logged evidence → threshold
| Outcome | Assessment | Logged evidence (Notebook / state) | Success threshold |
|---|---|---|---|
| LO1 predict direction | Two transfer predictions with unfamiliar settings (Al area ×3; Cu length ×3) | `guided.transfer.answers` vs simulated direction | 2 of 2 correct **[PLANNED]** |
| LO2 isolate one property | Task 3 trial-pair selection + Task 4 judgement and repair | Selected `evidenceIds` differ only in material; Task 4 repair trial differs from G1 only in length; "changed" ticks match | Fair pair chosen in ≤ 2 attempts, and repair accepted **[PLANNED]** |
| LO3 matched double-length wire + explanation | Task 5 match + evidence pair + explanation category | Matching trial (NiCr, 2.00 m, 1.00 mm²), evidence pair includes it, explanation category `supported_reasoning` (AI or built-in) | Match achieved; explanation references both length and area **[PLANNED]** |
| Misconception shift | Original reason vs revised claim (Tasks 1–2) | Notebook "Original / Revised" columns | Misconception reason revised to a supported claim **[PLANNED]** |
| C4 time | Active time on summary screen | `activeMs` | Full sequence ≤ 10 min **[PLANNED]** — observed: **[FILL: observed session duration]** |

Verified so far: the instruments log every field above (D5). Learner data has not been collected yet.

## AI-use log and reflection
| # | Tool / chat | Purpose | Link |
|---|---|---|---|
| 1 | Claude Code (Opus 5.5) | Design doc, implementation, verification, deployment, report draft | **[FILL: chat link 1]** |
| 2 | | | **[FILL: chat link 2]** |
| 3 | | | **[FILL: chat link 3]** |

What the AI produced versus what I verified or changed myself: **[FILL]**

**Personal reflection:** **[FILL: your own reflection — what worked, what you would change, what you learned about designing for an anxious repeating learner]**
