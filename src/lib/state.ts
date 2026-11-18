// Single app state shared by Guided, Free Bench and Notebook.
// Persisted to localStorage after every change (see useWireLab).
import { REFERENCE_WIRE, type WireSettings } from "../config/physics.ts";
import { TASK_ORDER, type TaskId, type AiCategory } from "../config/content.ts";
import { measure, type Direction, type Property } from "./physics.ts";

export const STORAGE_KEY = "wirelab-24B3926-v1";

export type View = "guided" | "free" | "notebook" | "about";
export type Branch = "sound" | "uncertain" | "misconception";
export type TrialContext = TaskId | "free" | "reference" | "given";

export interface Trial {
  id: string;
  n: number; // display number
  label: string; // "REF", "G1", "#3"
  settings: WireSettings;
  current: number; // mA, unrounded
  resistance: number; // Ω, unrounded
  context: TrialContext;
  at: number;
  note?: string; // e.g. "failed run"
}

export interface FeedbackMsg {
  tone: "info" | "good" | "nudge";
  text: string;
  source?: "ai" | "built-in";
  category?: AiCategory;
}

export interface TaskState {
  stage: string;
  prediction: Direction | null;
  reasonChip: string | null;
  reasonDraft: string;
  savedReason: string | null;
  branch: Branch | null;
  trialIds: string[];
  higher: "reference" | "test" | null;
  same: Property[] | string[];
  choice: string | null;
  changed: string[];
  revisedDraft: string;
  revisedClaim: string | null;
  evidenceIds: string[];
  feedback: FeedbackMsg | null;
  followUp: FeedbackMsg | null;
  hints: number;
  failCount: number;
  nextChoice: string | null;
  workedShown: boolean;
  done: boolean;
  viewing?: "original" | "trial";
}

export type MysteryStage = "ask" | "inspect" | "claim" | "done";
export interface MysteryCaseState {
  stage: MysteryStage;
  first: string | null; // answer to "Can the meter alone tell you?"
  inspected: ("ruler" | "faces")[];
  claim: string | null;
  obs: string | null;
  text: string;
  feedback: FeedbackMsg | null;
}
export interface MysteryLogEntry {
  label: string; // "Mystery 1" / "Mystery 2"
  first: string | null;
  inspected: string[];
  claim: string;
  observation: string;
  text: string;
  correct: boolean;
  at: number;
}
export interface MysteryLabState {
  order: ("X" | "Y")[];
  active: number; // index into order
  cases: Record<"X" | "Y", MysteryCaseState>;
}
export const newMysteryCase = (): MysteryCaseState => ({ stage: "ask", first: null, inspected: [], claim: null, obs: null, text: "", feedback: null });
export function newMysteryLab(): MysteryLabState {
  return { order: Math.random() < 0.5 ? ["X", "Y"] : ["Y", "X"], active: 0, cases: { X: newMysteryCase(), Y: newMysteryCase() } };
}

export interface AppState {
  v: 1;
  createdAt: number;
  activeMs: number;
  view: View;
  draft: WireSettings;
  lastTested: WireSettings | null;
  lastTrialId: string | null;
  trials: Trial[];
  nextN: number;
  locked: Record<Property, boolean>;
  pinnedId: string | null;
  compareIds: string[];
  notebookEvidence: string[];
  notebookTab?: "records" | "mystery";
  mysteryLab?: MysteryLabState;
  mysteryLog?: MysteryLogEntry[];
  guided: {
    started: boolean;
    index: number; // 0..4 tasks, 5 = transfer, 6 = finished
    tasks: Record<TaskId, TaskState>;
    formulaRevealed: boolean;
    transfer: { answers: (Direction | null)[]; checked: boolean };
    finishedAt: number | null;
  };
}

export const FIRST_STAGE: Record<TaskId, string> = {
  length: "predict",
  area: "predict",
  material: "test",
  fair: "judge",
  mystery: "hypothesis",
};

export function newTaskState(id: TaskId): TaskState {
  return {
    stage: FIRST_STAGE[id],
    prediction: null,
    reasonChip: null,
    reasonDraft: "",
    savedReason: null,
    branch: null,
    trialIds: [],
    higher: null,
    same: [],
    choice: null,
    changed: [],
    revisedDraft: "",
    revisedClaim: null,
    evidenceIds: [],
    feedback: null,
    followUp: null,
    hints: 0,
    failCount: 0,
    nextChoice: null,
    workedShown: false,
    done: false,
  };
}

export function makeTrial(id: string, label: string, n: number, settings: WireSettings, context: TrialContext): Trial {
  const m = measure(settings);
  return { id, label, n, settings: { ...settings }, current: m.current, resistance: m.resistance, context, at: Date.now() };
}

export function initialState(): AppState {
  const tasks = Object.fromEntries(TASK_ORDER.map((t) => [t, newTaskState(t)])) as Record<TaskId, TaskState>;
  return {
    v: 1,
    createdAt: Date.now(),
    activeMs: 0,
    view: "guided",
    draft: { ...REFERENCE_WIRE },
    lastTested: null,
    lastTrialId: null,
    trials: [makeTrial("REF", "REF", 0, REFERENCE_WIRE, "reference")],
    nextN: 1,
    locked: { material: false, length: false, area: false },
    pinnedId: "REF",
    compareIds: [],
    notebookEvidence: [],
    guided: {
      started: false,
      index: 0,
      tasks,
      formulaRevealed: false,
      transfer: { answers: [null, null], checked: false },
      finishedAt: null,
    },
  };
}

export function loadState(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AppState;
    if (s && s.v === 1 && s.guided && Array.isArray(s.trials)) return s;
  } catch {
    /* storage blocked or corrupt — start fresh */
  }
  return null;
}

export function saveState(s: AppState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const findTrial = (s: AppState, id: string | null | undefined) => s.trials.find((t) => t.id === id) ?? null;
export const reference = (s: AppState) => s.trials.find((t) => t.id === "REF")!;
