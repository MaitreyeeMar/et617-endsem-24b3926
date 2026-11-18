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
export const LENGTHS_M = [0.5, 1.0, 1.5, 2.0];
export const AREAS_MM2 = [0.25, 0.5, 0.75, 1.0];

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
