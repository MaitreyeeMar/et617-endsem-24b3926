// Built-in (rule-based) reasoning classifier + trial-specific prompts.
// Used for prediction branching and as the fallback when AI is unavailable.
import { FOLLOW_UPS, type AiCategory, type ReasonKind, type TaskId, BUILT_IN_NOTICE } from "../config/content.ts";
import { MATERIALS } from "../config/physics.ts";
import { changedProperties, currentsMatch, fmtmA, type Property } from "./physics.ts";
import type { Branch, FeedbackMsg, Trial } from "./state.ts";

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

/** Classify a free-text reason with simple keyword rules. */
export function classifyReasonText(task: TaskId, text: string): ReasonKind {
  const t = text.toLowerCase();
  if (t.trim().length < 4 || has(t, ["not sure", "dont know", "don't know", "no idea", "guess"])) return "unsure";
  const moreMaterial = has(t, ["more material", "more metal", "more wire", "more conduct", "more stuff"]);
  const inTheWay = has(t, ["in the way", "block", "obstruct", "crowd"]);
  if (task === "length" && moreMaterial && has(t, ["more current", "current increase", "more flow", "flows more"])) return "length_misconception";
  if (task === "area" && (inTheWay || (moreMaterial && has(t, ["more resistance", "less current"])))) return "area_misconception";
  if (has(t, ["resistance", "path", "harder", "easier", "room", "wider", "thicker", "longer", "rho", "ρ", "halves", "doubles", "cancel"])) return "supported";
  return "unsure";
}

/** Branch on prediction + stated reason. */
export function branchFor(correct: boolean, reason: ReasonKind): Branch {
  if (!correct) return "misconception";
  if (reason === "length_misconception" || reason === "area_misconception") return "uncertain";
  return reason === "supported" ? "sound" : "uncertain";
}

const PROP_NAME: Record<Property, string> = { material: "material", length: "length", area: "area" };
export const listProps = (ps: Property[]) =>
  ps.length === 0 ? "nothing" : ps.map((p) => PROP_NAME[p]).join(ps.length === 2 ? " and " : ", ");

export function describeTrial(t: Trial): string {
  return `${t.label}: ${MATERIALS[t.settings.material].label}, ${t.settings.length.toFixed(2)} m, ${t.settings.area.toFixed(2)} mm² → ${fmtmA(t.current)} mA`;
}

/** Map a reasoning category onto a built-in category for an explanation text. */
export function localCategory(task: TaskId, text: string, trials: Trial[]): AiCategory {
  const kind = classifyReasonText(task === "mystery" ? "length" : task, text);
  if (kind === "length_misconception") return "length_misconception";
  if (kind === "area_misconception" || (task === "area" && classifyReasonText("area", text) === "area_misconception")) return "area_misconception";
  if (trials.length === 2) {
    const ch = changedProperties(trials[0].settings, trials[1].settings);
    if (task !== "mystery" && ch.length > 1) return "confounded_comparison";
  }
  return kind === "supported" ? "supported_reasoning" : "unclear";
}

/** Trial-specific built-in follow-up, used whenever AI is not used. */
export function builtInFollowUp(task: TaskId, text: string, trials: Trial[]): FeedbackMsg {
  const cat = localCategory(task, text, trials);
  let specific = "";
  if (trials.length === 2) {
    const [a, b] = trials;
    const ch = changedProperties(a.settings, b.settings);
    const hi = a.current >= b.current ? a : b;
    const tail = currentsMatch(a.current, b.current) ? "Both have the same resistance." : `${hi.label} had less resistance.`;
    specific = ` ${a.label} gave ${fmtmA(a.current)} mA and ${b.label} gave ${fmtmA(b.current)} mA. Changed: ${listProps(ch)}. ${tail}`;
  }
  return { tone: cat === "supported_reasoning" ? "good" : "nudge", text: FOLLOW_UPS[cat] + specific, source: "built-in", category: cat };
}

export interface ClassifyRequest {
  task: TaskId;
  explanation: string;
  trials: { label: string; material: string; length: number; area: number; current_mA: number }[];
}

/** Call the server AI endpoint; fall back to built-in feedback on any problem. */
export async function getExplanationFeedback(task: TaskId, text: string, trials: Trial[]): Promise<FeedbackMsg> {
  const body: ClassifyRequest = {
    task,
    explanation: text.slice(0, 800),
    trials: trials.map((t) => ({
      label: t.label,
      material: t.settings.material,
      length: t.settings.length,
      area: t.settings.area,
      current_mA: t.current,
    })),
  };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (data && data.ok && typeof data.followUp === "string" && data.category) {
      return { tone: data.category === "supported_reasoning" ? "good" : "nudge", text: data.followUp, source: "ai", category: data.category };
    }
  } catch {
    /* network error / timeout → built-in */
  }
  return builtInFollowUp(task, text, trials);
}

export { BUILT_IN_NOTICE };
