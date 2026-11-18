// Run: npm run verify — checks the three required reference cases.
import { measure, currentsMatch } from "../src/lib/physics.ts";
import type { WireSettings } from "../src/config/physics.ts";

const cases: { name: string; w: WireSettings; R: number; I: number }[] = [
  { name: "Reference (nichrome 1.00 m, 0.50 mm²)", w: { material: "nichrome", length: 1, area: 0.5 }, R: 2.2, I: 45.45 },
  { name: "Double length only (2.00 m, 0.50 mm²)", w: { material: "nichrome", length: 2, area: 0.5 }, R: 4.4, I: 22.73 },
  { name: "Double length and area (2.00 m, 1.00 mm²)", w: { material: "nichrome", length: 2, area: 1 }, R: 2.2, I: 45.45 },
];

let ok = true;
for (const c of cases) {
  const m = measure(c.w);
  const pass = m.resistance.toFixed(2) === c.R.toFixed(2) && m.current.toFixed(2) === c.I.toFixed(2);
  ok &&= pass;
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.name}: R = ${m.resistance.toFixed(4)} Ω, I = ${m.current.toFixed(4)} mA`);
}
const ref = measure(cases[0].w).current;
const dbl = measure(cases[2].w).current;
const match = currentsMatch(ref, dbl);
ok &&= match;
console.log(`${match ? "PASS" : "FAIL"}  Unrounded match check reference vs double-both: ${ref} vs ${dbl}`);
const noMatch = !currentsMatch(ref, measure(cases[1].w).current);
ok &&= noMatch;
console.log(`${noMatch ? "PASS" : "FAIL"}  Double-length-only does NOT match reference`);
process.exit(ok ? 0 : 1);
