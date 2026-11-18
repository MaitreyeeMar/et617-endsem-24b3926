// The ONE simulation engine. Every mode calls these functions.
import { MATERIALS, VOLTAGE_V, MATCH_TOLERANCE, type WireSettings } from "../config/physics.ts";

export type Property = "material" | "length" | "area";
export const PROPERTIES: Property[] = ["material", "length", "area"];

/** R = rho × L / A   (Ω, with rho in Ω·mm²/m, L in m, A in mm²) */
export function resistanceOhm(w: WireSettings): number {
  return (MATERIALS[w.material].rho * w.length) / w.area;
}

/** I = V / R, returned in mA (unrounded). */
export function currentmA(w: WireSettings): number {
  return (VOLTAGE_V / resistanceOhm(w)) * 1000;
}

export function measure(w: WireSettings) {
  return { resistance: resistanceOhm(w), current: currentmA(w) };
}

export function currentsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) <= MATCH_TOLERANCE * Math.max(Math.abs(a), Math.abs(b));
}

export function sameSettings(a: WireSettings | null | undefined, b: WireSettings | null | undefined): boolean {
  if (!a || !b) return false;
  return a.material === b.material && a.length === b.length && a.area === b.area;
}

/** Which properties differ between two wires. */
export function changedProperties(a: WireSettings, b: WireSettings): Property[] {
  return PROPERTIES.filter((p) => a[p] !== b[p]);
}

export type Direction = "increase" | "decrease" | "same";
export function direction(from: number, to: number): Direction {
  if (currentsMatch(from, to)) return "same";
  return to > from ? "increase" : "decrease";
}

export const fmtmA = (x: number) => x.toFixed(2);
export const fmtOhm = (x: number) => (x >= 0.1 ? x.toFixed(2) : x.toFixed(3));
export const fmtL = (x: number) => x.toFixed(2);
export const fmtA = (x: number) => x.toFixed(2);
