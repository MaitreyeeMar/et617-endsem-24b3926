"use client";
// Live workbench: formula above one large illustrated wire, flow-dot cue, one meter, three sliders.
// Slider movement is a LIVE PREVIEW (draft only). Notebook entries are made only by "Save trial".
import { useEffect, useRef, useState } from "react";
import {
  AREA_RANGE, LENGTH_RANGE, MATERIALS, MATERIAL_IDS, VOLTAGE_V, FLOW_MAX_DOTS_PER_S, type WireSettings,
} from "@/config/physics";
import { BENCH_TEXT } from "@/config/content";
import { currentsMatch, flowRate, fmtmA, fmtOhm, measure, type Property } from "@/lib/physics";
import type { Trial } from "@/lib/state";

// ── Geometry (SVG units). Same length scale for the live wire and the reference ghost. ──
const X0 = 48; // left clip
const SPAN = 300; // px for 2.00 m
const WIRE_Y = 62;
const LEAD_Y = 172;
const MARKER_X = 96;
const DOT_GAP = 26;
const THICK_MAX = 22; // px at 1.00 mm²; thickness ∝ sqrt(A)
const FACE_R_MAX = 30; // enlarged end face radius at 1.00 mm²; radius ∝ sqrt(A)
const xFor = (L: number) => X0 + (L / 2) * SPAN;
const fmtRho = (r: number) => (r >= 1 ? r.toFixed(2) : r.toFixed(3));

// ── Qualitative symbol scaling (kept in a modest readable range) ──
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
const RHO_MIN = MATERIALS.copper.rho, RHO_MAX = MATERIALS.nichrome.rho;
const R_MIN = (RHO_MIN * LENGTH_RANGE.min) / AREA_RANGE.max;
const R_MAX = (RHO_MAX * LENGTH_RANGE.max) / AREA_RANGE.min;
const symScale = {
  rho: (rho: number) => lerp(0.78, 1.32, Math.log(rho / RHO_MIN) / Math.log(RHO_MAX / RHO_MIN)),
  L: (L: number) => lerp(0.78, 1.32, (L - LENGTH_RANGE.min) / (LENGTH_RANGE.max - LENGTH_RANGE.min)),
  A: (A: number) => lerp(0.78, 1.32, (A - AREA_RANGE.min) / (AREA_RANGE.max - AREA_RANGE.min)),
  R: (R: number) => lerp(0.75, 1.38, Math.log(R / R_MIN) / Math.log(R_MAX / R_MIN)),
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function LiveFormula({ w }: { w: WireSettings }) {
  const { resistance } = measure(w);
  const rho = MATERIALS[w.material].rho;
  const rhoTxt = fmtRho(rho);
  const Sym = ({ s, k, label }: { s: string; k: number; label: string }) => (
    <span className="sym-box" aria-hidden="true">
      <span className={`sym sym-${label}`} style={{ transform: `scale(${k.toFixed(3)})` }}>{s}</span>
    </span>
  );
  return (
    <div className="formula-live" role="img" aria-label={`R equals rho times L over A. ${rhoTxt} times ${w.length.toFixed(2)} over ${w.area.toFixed(2)} equals ${fmtOhm(resistance)} ohms.`}>
      <div className="fl-eq">
        <Sym s="R" k={symScale.R(resistance)} label="R" />
        <span className="fl-equals" aria-hidden="true">=</span>
        <span className="fl-frac" aria-hidden="true">
          <span className="fl-num">
            <Sym s="ρ" k={symScale.rho(rho)} label="rho" />
            <Sym s="L" k={symScale.L(w.length)} label="L" />
          </span>
          <span className="fl-bar" />
          <span className="fl-den">
            <Sym s="A" k={symScale.A(w.area)} label="A" />
          </span>
        </span>
      </div>
      <div className="fl-values" aria-hidden="true">
        <span className="fl-frac-sm">
          <span>{rhoTxt} × {w.length.toFixed(2)}</span>
          <span className="fl-bar-sm" />
          <span>{w.area.toFixed(2)}</span>
        </span>
        <span>= <strong>{fmtOhm(resistance)} Ω</strong></span>
      </div>
      <p className="fl-note">Symbol size is only a cue. The meter shows the calculated value.</p>
    </div>
  );
}

function WireScene({ w, ghost, current, paused }: { w: WireSettings; ghost: WireSettings | null; current: number; paused: boolean }) {
  const clipX = xFor(w.length);
  const thick = THICK_MAX * Math.sqrt(w.area);
  const faceR = FACE_R_MAX * Math.sqrt(w.area);
  const colour = MATERIALS[w.material].colour;
  const dotsRef = useRef<SVGGElement>(null);
  const phase = useRef(0);
  const rateRef = useRef(0);
  const { rate } = flowRate(current);
  rateRef.current = rate;

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      phase.current = (phase.current + rateRef.current * DOT_GAP * dt) % DOT_GAP; // px/s = rate × gap
      dotsRef.current?.setAttribute("transform", `translate(${phase.current.toFixed(2)} 0)`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  const dots = [];
  for (let x = X0 - DOT_GAP; x <= X0 + SPAN + DOT_GAP; x += DOT_GAP) dots.push(x);
  const ticks = [0, 0.5, 1, 1.5, 2];
  const gx = ghost ? xFor(ghost.length) : 0;
  const gt = ghost ? THICK_MAX * Math.sqrt(ghost.area) : 0;

  return (
    <svg viewBox="0 0 400 196" className="scene" role="img"
      aria-label={`Illustrated ${MATERIALS[w.material].label} wire, ${w.length.toFixed(2)} metres long, cross-sectional area ${w.area.toFixed(2)} square millimetres.${ghost ? ` Dashed outline shows the reference wire, ${ghost.length.toFixed(2)} m and ${ghost.area.toFixed(2)} mm².` : ""}`}>
      <defs>
        <clipPath id="lead-clip"><rect x={X0} y={LEAD_Y - 8} width={clipX - X0} height={16} /></clipPath>
        <linearGradient id="wire-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      {/* circuit leads */}
      <g stroke="var(--ink-3)" strokeWidth={2.5} fill="none" strokeLinecap="round">
        <path d={`M${X0} ${WIRE_Y} V${LEAD_Y}`} />
        <path d={`M${X0} ${LEAD_Y} H${clipX}`} />
        <path d={`M${clipX} ${WIRE_Y} V${LEAD_Y}`} />
      </g>
      {/* cell on the left lead */}
      <g aria-hidden="true">
        <rect x={X0 - 14} y={118} width={28} height={18} fill="var(--bg)" />
        <line x1={X0 - 12} y1={122} x2={X0 + 12} y2={122} stroke="var(--ink)" strokeWidth={3} />
        <line x1={X0 - 6} y1={131} x2={X0 + 6} y2={131} stroke="var(--ink)" strokeWidth={3} />
        <text x={X0 + 16} y={131} fontSize={10.5} fill="var(--ink-2)">{VOLTAGE_V.toFixed(2)} V</text>
      </g>
      {/* flow dots on the bottom lead + fixed marker */}
      <g clipPath="url(#lead-clip)">
        <g ref={dotsRef}>
          {dots.map((x) => <circle key={x} cx={x} cy={LEAD_Y} r={3.6} fill="var(--accent)" />)}
        </g>
      </g>
      <g aria-hidden="true">
        <line x1={MARKER_X} y1={LEAD_Y - 11} x2={MARKER_X} y2={LEAD_Y + 11} stroke="var(--ink)" strokeWidth={2} />
        <text x={MARKER_X} y={LEAD_Y + 22} fontSize={9.5} textAnchor="middle" fill="var(--ink-2)">marker</text>
      </g>
      {/* the wire */}
      <rect x={X0} y={WIRE_Y - thick / 2} width={clipX - X0} height={thick} rx={thick / 2} fill={colour} />
      <rect x={X0} y={WIRE_Y - thick / 2} width={clipX - X0} height={thick} rx={thick / 2} fill="url(#wire-shine)" />
      <ellipse cx={clipX} cy={WIRE_Y} rx={thick * 0.22} ry={thick / 2} fill={colour} stroke="var(--ink)" strokeOpacity={0.35} />
      {/* reference ghost — drawn ON TOP so it stays visible inside a longer/thicker wire */}
      {ghost && (
        <g aria-hidden="true">
          <rect x={X0} y={WIRE_Y - gt / 2} width={gx - X0} height={gt} rx={gt / 2} fill="var(--panel)" fillOpacity={0.3} stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="5 3" />
          <line x1={gx} y1={WIRE_Y - 22} x2={gx} y2={WIRE_Y - 13} stroke="var(--ink)" strokeWidth={1.2} />
          <text x={gx} y={WIRE_Y - 25} textAnchor="middle" fontSize={9.5} fill="var(--ink)">reference</text>
        </g>
      )}
      {/* clips */}
      {[X0, clipX].map((x, i) => (
        <g key={i} aria-hidden="true">
          <rect x={x - 7} y={WIRE_Y - 17} width={14} height={34} rx={4} fill={i ? "var(--accent)" : "var(--ink-2)"} />
          <rect x={x - 3} y={WIRE_Y - 12} width={6} height={24} rx={2} fill="var(--panel)" opacity={0.45} />
        </g>
      ))}
      {/* ruler */}
      <g aria-hidden="true">
        <rect x={X0 - 6} y={92} width={SPAN + 12} height={20} rx={4} fill="var(--ruler)" stroke="var(--line)" />
        {Array.from({ length: 41 }, (_, i) => i * 0.05).map((m) => (
          <line key={m} x1={xFor(m)} y1={92} x2={xFor(m)} y2={m % 0.5 < 0.001 || m % 0.5 > 0.499 ? 100 : 96} stroke="var(--ink-3)" strokeWidth={0.7} />
        ))}
        {ticks.map((m) => <text key={m} x={xFor(m)} y={108} textAnchor="middle" fontSize={9} fill="var(--ink-2)">{m.toFixed(1)} m</text>)}
      </g>
    </svg>
  );
}

export function EndFace({ area, refArea }: { area: number; refArea?: number }) {
  const r = FACE_R_MAX * Math.sqrt(area);
  const rr = refArea ? FACE_R_MAX * Math.sqrt(refArea) : 0;
  return (
    <figure className="endface">
      <svg viewBox="0 0 72 72" width={72} height={72} role="img" aria-label={`Enlarged end face, area ${area.toFixed(2)} square millimetres${refArea ? `, ${(area / refArea).toFixed(2)} times the reference` : ""}`}>
        <circle cx={36} cy={36} r={r} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
        {refArea && <circle cx={36} cy={36} r={rr} fill="none" stroke="var(--ink-3)" strokeDasharray="3 2" />}
      </svg>
      <figcaption>End face<strong>{area.toFixed(2)} mm²</strong></figcaption>
    </figure>
  );
}

function Slider({ id, label, min, max, step, value, onInput, valueText, disabled, display, ticks, lockBox }: {
  id: string; label: string; min: number; max: number; step: number; value: number; onInput: (v: number) => void;
  valueText: string; disabled: boolean; display: React.ReactNode; ticks?: string[]; lockBox?: React.ReactNode;
}) {
  return (
    <div className={`slider ${disabled ? "is-locked" : ""}`}>
      <div className="slider-head">
        <label htmlFor={id}>{label}</label>
        <span className="slider-val">{display}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        aria-valuetext={valueText} onChange={(e) => onInput(Number(e.target.value))} />
      {ticks && <div className="slider-ticks" aria-hidden="true">{ticks.map((t) => <span key={t}>{t}</span>)}</div>}
      {lockBox}
    </div>
  );
}

export interface CompareSpec {
  original: Trial; // saved snapshot
  trial: Trial; // saved snapshot
  viewing: "original" | "trial";
  onSwitch: (v: "original" | "trial") => void;
}

export interface BenchProps {
  draft: WireSettings;
  onChange: (p: Property, v: string | number) => void;
  unlocked: Property[];
  lockedNote?: string;
  referenceTrial: Trial;
  referenceLabel: string;
  savedTrials?: Trial[];
  locked?: Record<Property, boolean>;
  onToggleLock?: (p: Property) => void;
  /** Single-variable layout: only this slider, placed directly under the circuit. */
  focus?: Property;
  /** "Original wire | My trial" view of two saved snapshots. Never touches the draft. */
  compare?: CompareSpec;
}

function CurrentBars({ a, b, active }: { a: Trial; b: Trial; active: "original" | "trial" }) {
  const max = Math.max(a.current, b.current);
  const rows: [string, Trial, "original" | "trial"][] = [["Original wire", a, "original"], ["My trial", b, "trial"]];
  return (
    <div className="bars" role="img" aria-label={`Current comparison: original wire ${fmtmA(a.current)} milliamps, my trial ${fmtmA(b.current)} milliamps.`}>
      {rows.map(([label, t, key]) => (
        <div key={key} className={`bar-row ${active === key ? "on" : ""}`} aria-hidden="true">
          <span className="bar-label">{label}</span>
          <span className="bar-track"><span className={`bar-fill bar-${key}`} style={{ width: `${(t.current / max) * 100}%` }} /></span>
          <span className="bar-val mono">{fmtmA(t.current)} mA</span>
        </div>
      ))}
    </div>
  );
}

export function Bench(props: BenchProps) {
  const { draft, onChange, unlocked, referenceTrial: ref, compare, focus } = props;
  const reduced = usePrefersReducedMotion();
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;
  // What the circuit shows: the live draft, or one of the two saved snapshots.
  const shownTrial = compare ? (compare.viewing === "original" ? compare.original : compare.trial) : null;
  const shown = shownTrial ? shownTrial.settings : draft;
  const m = measure(shown);
  const flow = flowRate(m.current);
  const ratio = m.current / ref.current;
  const matIndex = MATERIAL_IDS.indexOf(draft.material);
  const isOpen = (p: Property) => unlocked.includes(p) && !props.locked?.[p];
  const lockBox = (p: Property) =>
    props.onToggleLock ? (
      <label className="lock"><input type="checkbox" checked={!!props.locked?.[p]} onChange={() => props.onToggleLock!(p)} /> Lock {p}</label>
    ) : null;

  const sliders: Record<Property, React.ReactNode> = {
    material: (
      <Slider key="m" id="sl-material" label="Material · resistivity (ρ)" min={0} max={2} step={1} value={matIndex}
        onInput={(v) => onChange("material", MATERIAL_IDS[v])} disabled={!isOpen("material")}
        valueText={`${MATERIALS[draft.material].label}, rho ${fmtRho(MATERIALS[draft.material].rho)} ohm square millimetre per metre`}
        display={<><strong>{MATERIALS[draft.material].label}</strong> · ρ = {fmtRho(MATERIALS[draft.material].rho)} Ω·mm²/m</>}
        ticks={MATERIAL_IDS.map((x) => MATERIALS[x].label)} lockBox={lockBox("material")} />
    ),
    length: (
      <Slider key="l" id="sl-length" label="Length (L)" {...LENGTH_RANGE} value={draft.length}
        onInput={(v) => onChange("length", v)} disabled={!isOpen("length")}
        valueText={`${draft.length.toFixed(2)} metres`} display={<strong>{draft.length.toFixed(2)} m</strong>}
        ticks={["0.50", "1.00", "1.50", "2.00"]} lockBox={lockBox("length")} />
    ),
    area: (
      <Slider key="a" id="sl-area" label="Cross-sectional area (A)" {...AREA_RANGE} value={draft.area}
        onInput={(v) => onChange("area", v)} disabled={!isOpen("area")}
        valueText={`${draft.area.toFixed(2)} square millimetres`} display={<strong>{draft.area.toFixed(2)} mm²</strong>}
        ticks={["0.25", "0.50", "0.75", "1.00"]} lockBox={lockBox("area")} />
    ),
  };
  const fixedLine = focus
    ? (["material", "length", "area"] as Property[])
        .filter((p) => p !== focus)
        .map((p) =>
          p === "material"
            ? `${MATERIALS[draft.material].label} (ρ ${fmtRho(MATERIALS[draft.material].rho)})`
            : p === "length"
              ? `L ${draft.length.toFixed(2)} m`
              : `A ${draft.area.toFixed(2)} mm²`,
        )
        .join(" · ")
    : "";

  const meterHead = shownTrial
    ? `Saved reading · ${compare!.viewing === "original" ? "Original wire" : "My trial"} (${shownTrial.label})`
    : "Current meter · live";

  return (
    <div className={`bench ${focus ? "bench-focus" : ""}`}>
      <section className="stage-card" aria-label={shownTrial ? "Saved wire view" : "Live wire"}>
        {compare ? (
          <div className="view-switch" role="radiogroup" aria-label="Choose which saved wire to show">
            {(["original", "trial"] as const).map((v) => (
              <label key={v} className={`vs-opt ${compare.viewing === v ? "on" : ""}`}>
                <input type="radio" name="view-switch" value={v} checked={compare.viewing === v} onChange={() => compare.onSwitch(v)} />
                <span>{v === "original" ? "Original wire" : "My trial"}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="ref-strip">
            <span className="ref-dot" aria-hidden="true" />
            <span><strong>{props.referenceLabel}:</strong> {MATERIALS[ref.settings.material].label}, {ref.settings.length.toFixed(2)} m, {ref.settings.area.toFixed(2)} mm² → <strong className="mono">{fmtmA(ref.current)} mA</strong></span>
            <span className="muted small">(dashed outline)</span>
          </div>
        )}
        <LiveFormula w={shown} />
        <div className="scene-row">
          <WireScene w={shown} ghost={compare ? null : ref.settings} current={m.current} paused={paused} />
          <EndFace area={shown.area} refArea={compare ? undefined : ref.settings.area} />
        </div>
        {focus && !compare && (
          <div className="focus-slider">
            {sliders[focus]}
            <p className="fixed-line"><span className="muted">Fixed:</span> {fixedLine}</p>
          </div>
        )}
        <div className="meter" aria-live="polite" aria-atomic="true">
          <div className="meter-head">
            <span>{meterHead}</span>
            {!compare && (
              <span className="meter-cmp">
                {currentsMatch(m.current, ref.current) ? "Same as reference" : `×${ratio.toFixed(2)} of reference`}
              </span>
            )}
          </div>
          <div className="meter-value" data-testid="meter">{fmtmA(m.current)}<span className="unit">mA</span></div>
          <div className="meter-sub">
            {MATERIALS[shown.material].label}, {shown.length.toFixed(2)} m, {shown.area.toFixed(2)} mm² · R = {fmtOhm(m.resistance)} Ω
          </div>
        </div>
        <div className="flow-row">
          <span className="flow-text" data-rate={flow.rate.toFixed(4)}>
            Flow cue: {flow.rate.toFixed(2)} dots/s past the marker{flow.capped ? ` (capped at ${FLOW_MAX_DOTS_PER_S} — real current is far higher)` : ""}{paused ? " · paused" : ""}
          </span>
          <button className="btn btn-small" onClick={() => setUserPaused(!paused)} aria-pressed={paused}>
            {paused ? "▶ Play flow" : "❚❚ Pause flow"}
          </button>
        </div>
        {compare && <CurrentBars a={compare.original} b={compare.trial} active={compare.viewing} />}
      </section>

      {focus ? (
        <p className="muted small view-note">
          {compare ? "Switching views shows your saved readings. Your slider stays where you left it." : props.lockedNote}
        </p>
      ) : (
        <section className="controls" aria-label="Wire sliders">
          <div className="controls-head">
            <strong>{BENCH_TEXT.slidersTitle}</strong>
            {props.lockedNote && <span className="muted small">{props.lockedNote}</span>}
          </div>
          {sliders.material}
          {sliders.length}
          {sliders.area}
          {props.savedTrials && props.savedTrials.length > 0 && (
            <div className="saved-strip">
              <span className="muted small">Saved trials</span>
              <ul>
                {props.savedTrials.slice(-4).map((t) => (
                  <li key={t.id}><span className="mono">{t.label}</span> {MATERIALS[t.settings.material].label.slice(0, 2)} · {t.settings.length.toFixed(2)} m · {t.settings.area.toFixed(2)} mm² → <strong className="mono">{fmtmA(t.current)}</strong></li>
                ))}
              </ul>
            </div>
          )}
          <p className="assume">Ideal model: {VOLTAGE_V.toFixed(2)} V fixed, constant temperature, ideal meter.</p>
        </section>
      )}
    </div>
  );
}
