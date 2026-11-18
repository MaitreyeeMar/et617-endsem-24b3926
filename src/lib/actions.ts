// Shared mutations. All take a cloned state and mutate it in place.
import type { WireSettings } from "../config/physics.ts";
import type { Property } from "./physics.ts";
import { makeTrial, type AppState, type Trial, type TrialContext } from "./state.ts";

export type Updater = (fn: (s: AppState) => void) => void;

export function setDraft(s: AppState, p: Property, v: string | number) {
  if (s.locked[p] && s.view === "free") return;
  (s.draft as unknown as Record<string, string | number>)[p] = v;
}

/** Press "Test wire": measure the draft and log a trial. */
export function runTest(s: AppState, context: TrialContext): Trial {
  const n = s.nextN++;
  const t = makeTrial(`T${n}-${Date.now().toString(36)}`, `#${n}`, n, s.draft, context);
  s.trials.push(t);
  s.lastTested = { ...s.draft };
  s.lastTrialId = t.id;
  return t;
}

export function resetDraft(s: AppState, w: WireSettings) {
  s.draft = { ...w };
}
