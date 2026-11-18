# WireLab: The Mystery Wire — Design

**Roll number:** 24B3926 · **Card:** P5 (Inquiry-based virtual lab) · P5-T4 (Electrical resistance: length, area, material — Class 10) · L5 (repeating learner, high anxiety, low self-efficacy) · C4 (one sequence ≤ 10 min, stop and resume exactly)

## 1. Educational problem
Class 10 learners can plug numbers into V = IR but often cannot reason about *why* a wire's resistance changes. Two persistent misconceptions:

1. **Length misconception:** "A longer wire draws more current because it has more conducting material."
2. **Area misconception:** "A thicker wire has more resistance because there is more material in the way."

A learner who has failed this topic once tends to avoid committing to a prediction. A low-stakes, private virtual bench lets them predict, test, see the meter disagree with them, and revise without anyone watching.

## 2. Learning outcomes
By the end the learner can:
- **LO1:** Predict the direction of current change in two fresh controlled trials.
- **LO2:** Construct a pair of trials that isolates one wire property and identify what stayed fixed.
- **LO3:** Build a double-length wire that matches the reference current and use readings from two trials to explain why it works.

## 3. Persona — Aarya, 15
- Class 10, can read an ammeter and use V = IR.
- Failed a resistance question; hesitates to guess publicly; low self-efficacy.
- Reads simple English. Revises on a shared Android phone after dinner (small screen, interrupted sessions).
- Goal: explain a meter reading confidently.

**Design implications:** private retries, no countdown/leaderboard, calm "Task 2 of 5" progress, optional clues, short sentences, big meters, thumb-reachable main action, automatic save and exact resume.

## 4. Physics model (ideal)
- Fixed ideal voltage V = 0.10 V across each wire, constant temperature, ideal ammeter.
- R = ρ·L/A with ρ in Ω·mm²/m, L in m, A in mm². I = V/R, shown in mA.
- ρ: copper 0.017, aluminium 0.028, nichrome 1.10 (rounded instructional constants).
- Settings: L ∈ {0.50, 1.00, 1.50, 2.00} m; A ∈ {0.25, 0.50, 0.75, 1.00} mm²; material ∈ {copper, aluminium, nichrome}.
- Reference wire: nichrome, 1.00 m, 0.50 mm² → 2.20 Ω, 45.45 mA.
- Check cases: 2 m / 0.50 mm² → 4.40 Ω, 22.73 mA; 2 m / 1.00 mm² → 2.20 Ω, 45.45 mA.
- Matches are checked with unrounded values (relative tolerance 1e-9).

## 5. Content plan — Guided Investigation (7–9 min)
| # | Task | Learner action | Main misconception addressed |
|---|------|----------------|------------------------------|
| 0 | Challenge | See the workbench: "Your replacement wire must be twice as long. Can you keep the current meter at the same reading?" | — |
| 1 | Length | Predict (up/down/same) + reason → Save prediction → set L = 2.00 m → Test wire → compare → revise | Length |
| 2 | Area | Predict + reason → double area → Test → compare enlarged end views | Area |
| 3 | Material | Test copper vs nichrome at same L, A → select the trial pair that supports a material claim | — |
| 4 | Fair test | Shown two trials where material *and* length changed → "Does this isolate length?" → repair and run | Confounding |
| 5 | Mystery Wire | Nichrome, L = 2.00 m, match 45.45 mA → hypothesis → retries (failed trials kept) → select evidence → explain | All |
| — | Transfer | Two quick predictions with unfamiliar settings (aluminium) | LO1 |

R = ρL/A is revealed only after the learner has observed the length comparison (end of Task 1).

### Feedback branching (per prediction task)
- Correct direction + sound reason → "Go test it yourself" (independent test).
- Correct direction + uncertain/unclear reason → short evidence question after the test.
- Misconception (wrong direction or misconception reason) → targeted comparison after the test: "Which wire gave the higher reading? What stayed the same?" → Revise claim.
- Mystery fail → "Keep your new length. Which property could you test next?" Failed trial preserved. Worked answer only after a revision attempt (or ≥2 failed runs plus an explicit request).

## 6. Screen map
```
Home / Workbench (challenge + both rigs)
 ├── Guided Investigation  (Task 1..5 of 5 → Transfer → Done summary)
 ├── Free Bench            (lock property, pin reference trial, compare two runs)
 ├── Lab Notebook          (table of trials, predictions, revisions, evidence selection)
 └── About                 (roll number, assumptions, credits)
Footer on every screen: "WireLab · Roll no. 24B3926"
Persistent: Save & leave · New attempt
```

## 7. One simulation engine, three modes
`src/lib/physics.ts` is the only place current is computed. Guided, Free Bench and Notebook share one state store (`src/lib/store.ts`), persisted to localStorage after every meaningful action. Draft settings and last tested settings are kept separately. Changing a control marks the wire "Ready to test" and keeps the previous reading visible and labelled.

## 8. Bounded AI feature (D6)
`POST /api/classify` receives the explanation, the selected trials and the task id. Server-side model call (key in env). Output must be one of `supported_reasoning | length_misconception | area_misconception | confounded_comparison | unclear`. The result is validated and cross-checked against the actual changed variables, then mapped to an authored follow-up question. On a missing key, timeout, invalid response or inconsistency, the app shows "Using built-in feedback" and uses a local rule-based, trial-specific prompt. All physics and success checks stay local.
