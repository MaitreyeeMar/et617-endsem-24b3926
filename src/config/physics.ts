// ─────────────────────────────────────────────────────────────
// PHYSICS CONSTANTS — edit here during the viva.
// Ideal model: fixed voltage, constant temperature, ideal ammeter.
// Units: rho in Ω·mm²/m, length in m, area in mm², current in mA.
// ─────────────────────────────────────────────────────────────

export type MaterialId = "copper" | "aluminium" | "nichrome";

export const VOLTAGE_V = 0.1;

export const MATERIALS: Record<MaterialId, { label: string; rho: number; colour: string }> = {
  copper: { label: "Copper", rho: 0.017, colour: "#c27a3a" },
  aluminium: { label: "Aluminium", rho: 0.028, colour: "#9aa3ad" },
  nichrome: { label: "Nichrome", rho: 1.1, colour: "#6b6f7a" },
};

export const MATERIAL_IDS: MaterialId[] = ["copper", "aluminium", "nichrome"];
// Slider ranges (continuous, fixed steps).
export const LENGTH_RANGE = { min: 0.5, max: 2.0, step: 0.05 }; // m
export const AREA_RANGE = { min: 0.25, max: 1.0, step: 0.05 }; // mm²

/** Snap a slider value to its step and 2 decimals so equality checks are exact. */
export function snap(v: number, r: { min: number; max: number; step: number }): number {
  const k = Math.round((v - r.min) / r.step);
  return Math.round(Math.min(r.max, Math.max(r.min, r.min + k * r.step)) * 100) / 100;
}
export function onStep(v: number, r: { min: number; max: number; step: number }): boolean {
  return v >= r.min - 1e-9 && v <= r.max + 1e-9 && Math.abs(snap(v, r) - v) < 1e-9;
}

// Flow cue: dots crossing a fixed marker. Crossing rate is PROPORTIONAL to current
// (reference 45.45 mA → 1.5 dots/s, so 22.73 mA → 0.75 dots/s). Very large copper/
// aluminium currents are capped so the animation stays readable; the cap is labelled.
export const FLOW_DOTS_PER_S_AT_REFERENCE = 1.5;
export const FLOW_MAX_DOTS_PER_S = 12;

export interface WireSettings {
  material: MaterialId;
  length: number; // m
  area: number; // mm²
}

export const REFERENCE_WIRE: WireSettings = { material: "nichrome", length: 1.0, area: 0.5 };

// Relative tolerance for "same current" checks (unrounded values).
export const MATCH_TOLERANCE = 1e-9;

export const ASSUMPTIONS = [
  "Ideal fixed voltage: 0.10 V across each wire.",
  "Constant temperature — the wire does not heat up.",
  "Ideal ammeter — the meter adds no resistance.",
  "Each wire is a separate test under the same voltage.",
  "ρ values are rounded classroom constants.",
];
