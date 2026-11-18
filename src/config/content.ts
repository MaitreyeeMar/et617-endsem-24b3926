// ─────────────────────────────────────────────────────────────
// ACTIVITY WORDING + FEEDBACK RULES — edit here during the viva.
// Plain, short English for Aarya (Class 10, reads simple English).
// ─────────────────────────────────────────────────────────────
import type { Direction } from "../lib/physics.ts";
import type { WireSettings } from "./physics.ts";

export const CHALLENGE =
  "Your replacement wire must be twice as long. Can you keep the current meter at the same reading?";

export const BENCH_TEXT = {
  slidersTitle: "Adjust the wire",
  referenceLabel: "Reference observation",
  locked: "Sliders unlock after you save your prediction",
  saveHint: "Dragging is a live preview. Press Save trial to record a reading in your notebook.",
};

export const DIRECTION_LABEL: Record<Direction, string> = {
  increase: "Current goes up",
  decrease: "Current goes down",
  same: "Current stays the same",
};

export type ReasonKind = "supported" | "length_misconception" | "area_misconception" | "unsure";
export interface ReasonChip { id: string; text: string; kind: ReasonKind }

export type TaskId = "length" | "area" | "material" | "fair" | "mystery";
export const TASK_ORDER: TaskId[] = ["length", "area", "material", "fair", "mystery"];

export const TASKS: Record<TaskId, { title: string; short: string }> = {
  length: { title: "Double the length", short: "Length" },
  area: { title: "Double the area", short: "Area" },
  material: { title: "Change the material", short: "Material" },
  fair: { title: "Is this a fair test?", short: "Fair test" },
  mystery: { title: "The Mystery Wire", short: "Mystery" },
};

// ── Task 1 & 2: predict → test → compare → revise ────────────
export const PREDICT_TASKS = {
  length: {
    question: "Only the length of the nichrome wire doubles: 1.00 m → 2.00 m. What happens to the current?",
    correct: "decrease" as Direction,
    target: { material: "nichrome", length: 2.0, area: 0.5 } as WireSettings,
    setupHint: "Drag the length slider to 2.00 m. Watch the meter and the dots, then press Save trial.",
    independentHint: "All sliders are open. Set up a fair test yourself — change only what the question asks — then Save trial.",
    chips: [
      { id: "l-more", text: "A longer wire has more metal, so more current can flow.", kind: "length_misconception" },
      { id: "l-path", text: "A longer wire is a longer path, so it has more resistance.", kind: "supported" },
      { id: "l-unsure", text: "I'm not sure yet.", kind: "unsure" },
    ] as ReasonChip[],
    afterSave: {
      length_misconception:
        "Trial saved. You said a longer wire has more metal, so more current can flow. Test that idea: use the switch above the circuit to compare your trial with the original wire.",
      area_misconception: "Trial saved. Use the switch above the circuit to compare your trial with the original wire.",
      wrongDirection: "Trial saved. Does the meter agree with your prediction? Use the switch above the circuit to compare.",
      unsure: "Trial saved. Use the switch above the circuit to compare your trial with the original wire.",
      sound: "Trial saved. Use the switch above the circuit to compare your trial with the original wire.",
    },
    compareQuestion: "Which wire gave the higher reading? What stayed the same?",
    evidenceQuestion: "Switch between the two views. Which one gives the higher reading and sends more dots past the marker?",
    reveal:
      "The 2.00 m wire gave a lower current. Double the length means double the resistance (2.20 Ω → 4.40 Ω), so the current halves (45.45 → 22.73 mA).",
    revisePrompt: "Write your new claim. Use the two readings.",
    reviseStarter: "When only the length doubled, the current ",
    clues: [
      "Watch how many dots pass the marker in each view.",
      "More length is like a longer, narrow corridor. It is harder to get through.",
    ],
  },
  area: {
    question: "Only the cross-sectional area doubles: 0.50 mm² → 1.00 mm². What happens to the current?",
    correct: "increase" as Direction,
    target: { material: "nichrome", length: 1.0, area: 1.0 } as WireSettings,
    setupHint: "Drag the area slider to 1.00 mm². Watch the end face grow and the dots speed up, then press Save trial.",
    independentHint: "All sliders are open. Set up a fair test yourself — change only what the question asks — then Save trial.",
    chips: [
      { id: "a-block", text: "A thicker wire has more material in the way, so less current.", kind: "area_misconception" },
      { id: "a-room", text: "A thicker wire gives more room for charge to flow, so less resistance.", kind: "supported" },
      { id: "a-unsure", text: "I'm not sure yet.", kind: "unsure" },
    ] as ReasonChip[],
    afterSave: {
      length_misconception: "Trial saved. Use the switch above the circuit to compare your trial with the original wire.",
      area_misconception:
        "Trial saved. You said a thicker wire puts more material in the way, so less current. Test that idea: use the switch above the circuit to compare your trial with the original wire.",
      wrongDirection: "Trial saved. Does the meter agree with your prediction? Use the switch above the circuit to compare.",
      unsure: "Trial saved. Use the switch above the circuit to compare your trial with the original wire.",
      sound: "Trial saved. Use the switch above the circuit to compare your trial with the original wire.",
    },
    compareQuestion: "Which wire gave the higher reading? What stayed the same?",
    evidenceQuestion: "Switch between the two views. Which one gives the higher reading and sends more dots past the marker?",
    reveal:
      "The thicker wire gave a higher current. The end-view circle has double the area, so there are twice as many paths side by side. Resistance halves (2.20 Ω → 1.10 Ω), current doubles (45.45 → 90.91 mA).",
    revisePrompt: "Write your new claim. Use the two readings and the end faces.",
    reviseStarter: "When only the area doubled, the current ",
    clues: [
      "Watch how many dots pass the marker.",
      "Compare the two end faces. The cross-sectional area is the size of the cut face.",
      "A wider road lets more cars pass at once.",
    ],
  },
} as const;

export const BRANCH_INTRO = {
  sound: "Good reasoning. Now test it yourself.",
  uncertain: "Your prediction is saved. Let's test it, then look at the evidence.",
  misconception: "Your prediction is saved. Let's see what the meter says — this is private, only you can see it.",
};

export const FORMULA_REVEAL = {
  title: "What you just saw has a rule",
  formula: "R = ρ × L / A",
  body: "Resistance R grows with length L and shrinks with area A. ρ (rho) depends on the material. Then I = V / R: more resistance means less current.",
};

// ── Task 3: material ─────────────────────────────────────────
export const MATERIAL_TASK = {
  instruction: "The material slider is open. Slide to copper (same length and area as the reference), watch the meter, and Save trial.",
  selectPrompt: "Pick the two trials that best support a claim about material.",
  claimQuestion: "What do your two trials show?",
  claims: [
    { id: "cu", text: "Copper gave a higher current, so copper has lower resistance for the same size.", correct: true },
    { id: "ni", text: "Nichrome gave a higher current, so nichrome conducts better.", correct: false },
    { id: "same", text: "Material makes no difference to current.", correct: false },
  ],
  feedback: {
    notFair: (changed: string) => `These two also differ in ${changed}. Pick a pair where only the material changed.`,
    sameMaterial: "Both of these trials use the same material. Pick one copper and one nichrome trial.",
    good: "Fair pair: only the material changed. Length and area stayed the same.",
    claimRight: "Right. Same size, different material, very different current. ρ for copper (0.017) is much smaller than nichrome (1.10).",
    claimWrong: "Look at the two meter readings again. Which material gave the bigger number?",
  },
  clues: ["Your reference wire is already nichrome, 1.00 m, 0.50 mm². Make a copper wire the same size."],
};

// ── Task 4: fair test ────────────────────────────────────────
export const FAIR_TASK = {
  given: [
    { id: "G1", label: "Trial G1", settings: { material: "nichrome", length: 1.0, area: 0.5 } as WireSettings },
    { id: "G2", label: "Trial G2", settings: { material: "copper", length: 2.0, area: 0.5 } as WireSettings },
  ],
  question: "A classmate says: “G2 is longer and has a bigger current, so longer wires give more current.” Do these two trials isolate length?",
  changedQuestion: "What changed between G1 and G2?",
  feedback: {
    right: "Correct — not a fair test. Both the material and the length changed, so we cannot tell which one caused the change.",
    wrongYes: "Look again at the material row. Is it the same in G1 and G2?",
    wrongChanged: "Check each row: material, length, area. Tick only the rows that are different.",
  },
  repairPrompt: "Repair the comparison. The sliders start at G2. Make a wire that differs from G1 in length ONLY, then Save trial.",
  repairGood: "Fair test! Only length changed from G1 — and the current went down.",
  repairBad: (changed: string) => `That trial differs from G1 in ${changed}. Keep everything except length the same as G1.`,
  repairSame: "That is the same wire as G1. Change the length only.",
};

// ── Task 5: mystery wire ─────────────────────────────────────
export const MYSTERY_TASK = {
  goal: "Build a nichrome wire that is 2.00 m long (twice the reference) and gives the same current as the reference: 45.45 mA.",
  hypothesisPrompt: "What will you change, and why? (A guess is fine.)",
  chips: [
    { id: "m-thick", text: "Make it thicker, to bring the resistance back down.", kind: "supported" },
    { id: "m-mat", text: "Change the material.", kind: "unsure" },
    { id: "m-unsure", text: "I'm not sure yet.", kind: "unsure" },
  ] as ReasonChip[],
  constraints: {
    material: "The replacement must stay nichrome — same material as the reference.",
    length: "The replacement must be twice as long: 2.00 m.",
  },
  stretchPrompt: "Step 1: drag the length slider to 2.00 m and Save trial. Watch what happens to the reading.",
  failQuestion: "Keep your new length. Which property could you test next?",
  nextChoices: [
    { id: "area", text: "Area", reply: "Area slider unlocked. Drag it and watch the meter. Bigger area → less resistance. Save trial when you think it matches." },
    { id: "material", text: "Material", reply: "Material slider unlocked — try it. But remember the brief: the replacement must stay nichrome. Save trial to check." },
    { id: "length", text: "Length", reply: "Length must stay 2.00 m — that is the whole challenge. Which other property could bring the current back up?" },
  ],
  tooLow: "Current is too low — this wire still has more resistance than the reference.",
  tooHigh: "Current is too high — this wire now has less resistance than the reference.",
  success: "Match! Your 2.00 m wire gives the same reading as the reference.",
  workedAnswer:
    "Double the area to 1.00 mm². R = 1.10 × 2.00 / 1.00 = 2.20 Ω, the same as the reference. So I = 0.10 V / 2.20 Ω = 45.45 mA. Doubling L doubles R; doubling A halves R; the two cancel.",
  evidencePrompt: "Select two trials as evidence for why your wire works. Include your matching trial.",
  evidenceNeedMatch: "Include the trial that matched 45.45 mA.",
  evidenceGood: "Good evidence pair.",
  explainPrompt: "Explain the match using your two readings.",
  explainStarter: "My 2.00 m wire gives the same current because ",
  clues: [
    "Doubling the length doubled the resistance. What could halve it again?",
    "Look at Task 2: what did doubling the area do to the current?",
  ],
};

// ── Transfer ─────────────────────────────────────────────────
export const TRANSFER = [
  {
    id: "t1",
    text: "An aluminium wire is 1.50 m long with area 0.25 mm². Its area becomes 0.75 mm² (length stays the same).",
    from: { material: "aluminium", length: 1.5, area: 0.25 } as WireSettings,
    to: { material: "aluminium", length: 1.5, area: 0.75 } as WireSettings,
  },
  {
    id: "t2",
    text: "A copper wire is 0.50 m long with area 1.00 mm². Its length becomes 1.50 m (area stays the same).",
    from: { material: "copper", length: 0.5, area: 1.0 } as WireSettings,
    to: { material: "copper", length: 1.5, area: 1.0 } as WireSettings,
  },
];

// ── AI category → authored follow-up questions ───────────────
export type AiCategory =
  | "supported_reasoning"
  | "length_misconception"
  | "area_misconception"
  | "confounded_comparison"
  | "unclear";
export const AI_CATEGORIES: AiCategory[] = [
  "supported_reasoning",
  "length_misconception",
  "area_misconception",
  "confounded_comparison",
  "unclear",
];

export const FOLLOW_UPS: Record<AiCategory, string> = {
  supported_reasoning: "Your explanation uses the evidence. Can you say which reading proves it, in one sentence?",
  length_misconception:
    "Look at the two meters: the longer wire gave the lower reading. What does a longer path do to resistance?",
  area_misconception:
    "Look at the end views: the bigger circle gave the higher reading. Does a wider wire make it harder or easier for charge to flow?",
  confounded_comparison:
    "Your two trials changed more than one thing. Which single property would you change to make a fair test?",
  unclear: "Try naming the property you changed and what the meter did. For example: “When ___ doubled, the current ___.”",
};

export const BUILT_IN_NOTICE = "Using built-in feedback";

export const UI = {
  readyToTest: "Ready to test",
  lastReading: "Last reading",
  notTested: "Not tested yet",
  saveLeave: "Save & leave",
  newAttempt: "New attempt",
  newAttemptConfirm: "Start a new attempt? Your notebook and progress will be cleared.",
  savedTitle: "Saved. You can close this page.",
  savedBody: "When you come back on this phone, you will continue exactly where you stopped.",
  privacy: "Retries are private. Nobody sees your guesses.",
};
