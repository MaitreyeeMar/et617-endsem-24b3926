"use client";
import { APP_NAME, COURSE, ROLL_NO } from "@/config/identity";
import { ASSUMPTIONS, MATERIALS, MATERIAL_IDS, VOLTAGE_V } from "@/config/physics";

export function About({ onNewAttempt }: { onNewAttempt: () => void }) {
  return (
    <div className="layout layout-wide">
      <section className="panel">
        <p className="eyebrow">About</p>
        <h1>{APP_NAME}</h1>
        <p className="roll">Roll number: <strong>{ROLL_NO}</strong></p>
        <p className="muted">{COURSE}</p>
        <p>An inquiry-based virtual lab for Class 10 learners revisiting electrical resistance. You predict, test a wire, compare readings and revise — privately, at your own pace.</p>
        <h3>Ideal assumptions</h3>
        <ul>{ASSUMPTIONS.map((a) => <li key={a}>{a}</li>)}</ul>
        <h3>Model</h3>
        <p>R = ρ × L / A (ρ in Ω·mm²/m, L in m, A in mm²) and I = V / R with V = {VOLTAGE_V.toFixed(2)} V.</p>
        <ul>{MATERIAL_IDS.map((m) => <li key={m}>{MATERIALS[m].label}: ρ = {MATERIALS[m].rho} Ω·mm²/m</li>)}</ul>
        <h3>Your data</h3>
        <p>Progress is saved only in this browser (localStorage). Written explanations may be sent to an AI model to choose a follow-up question; if that is unavailable, built-in feedback is used. No names are collected.</p>
        <button className="btn" onClick={onNewAttempt}>Start a new attempt</button>
      </section>
    </div>
  );
}
