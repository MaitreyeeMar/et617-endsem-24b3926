// Shared mutations. All take a cloned state and mutate it in place.
import { AREA_RANGE, LENGTH_RANGE, MATERIAL_IDS, snap, type WireSettings } from "../config/physics.ts";
import type { Property } from "./physics.ts";
import { makeTrial, type AppState, type Trial, type TrialContext } from "./state.ts";

export type Updater = (fn: (s: AppState) => void) => void;

/** Live slider preview: changes the draft only. Never creates a notebook entry. */
export function setDraft(s: AppState, p: Property, v: string | number) {
  if (p === "material") {
    if (MATERIAL_IDS.includes(v as never)) s.draft.material = v as WireSettings["material"];
  } else if (p === "length") s.draft.length = snap(Number(v), LENGTH_RANGE);
  else s.draft.area = snap(Number(v), AREA_RANGE);
}

/** Press "Save trial": record the current settings and reading in the notebook. */
export function saveTrial(s: AppState, context: TrialContext): Trial {
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
