"use client";
import { AREAS_MM2, LENGTHS_M, MATERIALS, MATERIAL_IDS, VOLTAGE_V, type WireSettings } from "@/config/physics";
import { RIG_LABELS, UI } from "@/config/content";
import { fmtmA, fmtOhm, sameSettings, type Property } from "@/lib/physics";
import type { Trial } from "@/lib/state";

const MAX_L = 2.0;
const MAX_A = 1.0;
const RULER_X0 = 28;
const RULER_W = 300;
const END_R_MAX = 34; // px radius for 1.00 mm² — radius ∝ sqrt(area), so displayed area ∝ area

function describe(w: WireSettings) {
  return `${MATERIALS[w.material].label}, ${w.length.toFixed(2)} m, ${w.area.toFixed(2)} mm²`;
}

function WireDiagram({ w, accent, title }: { w: WireSettings; accent: boolean; title: string }) {
  const wireLen = (w.length / MAX_L) * RULER_W; // same scale on both rigs
  const thick = 3 + 7 * Math.sqrt(w.area / MAX_A);
  const colour = accent ? "var(--accent)" : MATERIALS[w.material].colour;
  const ticks = [0, 0.5, 1.0, 1.5, 2.0];
  return (
    <svg viewBox="0 0 360 92" className="wire-svg" role="img" aria-label={`${title}: ${describe(w)}. Ruler 0 to 2 m.`}>
      {/* battery/voltage source */}
      <g aria-hidden="true">
        <line x1={RULER_X0} y1={30} x2={RULER_X0} y2={14} stroke="var(--ink-3)" strokeWidth={2} />
        <line x1={RULER_X0} y1={14} x2={RULER_X0 + RULER_W} y2={14} stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="3 3" />
        <rect x={150} y={5} width={60} height={18} rx={9} fill="var(--panel)" stroke="var(--line-strong)" />
        <text x={180} y={18} textAnchor="middle" fontSize={11} fill="var(--ink-2)">0.10 V</text>
      </g>
      {/* wire */}
      <line x1={RULER_X0} y1={40} x2={RULER_X0 + wireLen} y2={40} stroke={colour} strokeWidth={thick} strokeLinecap="round" />
      <circle cx={RULER_X0} cy={40} r={4} fill="var(--ink)" />
      <circle cx={RULER_X0 + wireLen} cy={40} r={4} fill="var(--ink)" />
      {/* ruler */}
      <g aria-hidden="true">
        <rect x={RULER_X0 - 6} y={58} width={RULER_W + 12} height={22} rx={4} fill="var(--ruler)" stroke="var(--line)" />
        {ticks.map((m) => {
          const x = RULER_X0 + (m / MAX_L) * RULER_W;
          return (
            <g key={m}>
              <line x1={x} y1={58} x2={x} y2={66} stroke="var(--ink-2)" strokeWidth={1.2} />
              <text x={x} y={77} textAnchor="middle" fontSize={9.5} fill="var(--ink-2)">{m.toFixed(1)} m</text>
            </g>
          );
        })}
        {Array.from({ length: 21 }, (_, i) => i * 0.1).map((m) => (
          <line key={m} x1={RULER_X0 + (m / MAX_L) * RULER_W} y1={58} x2={RULER_X0 + (m / MAX_L) * RULER_W} y2={62} stroke="var(--ink-3)" strokeWidth={0.6} />
        ))}
      </g>
    </svg>
  );
}

export function EndView({ area, accent, refArea }: { area: number; accent: boolean; refArea?: number }) {
  const r = END_R_MAX * Math.sqrt(area / MAX_A);
  const ratio = refArea ? area / refArea : null;
  return (
    <figure className="endview">
      <svg viewBox="0 0 80 80" width={80} height={80} role="img" aria-label={`Enlarged end view: cross-sectional area ${area.toFixed(2)} mm²${ratio && ratio !== 1 ? `, ${ratio.toFixed(1)} times the reference` : ""}`}>
        <circle cx={40} cy={40} r={END_R_MAX} fill="none" stroke="var(--line)" strokeDasharray="2 3" />
        <circle cx={40} cy={40} r={r} fill={accent ? "var(--accent-soft)" : "var(--wire-soft)"} stroke={accent ? "var(--accent)" : "var(--ink-3)"} strokeWidth={2} />
      </svg>
      <figcaption>
        End view (enlarged)
        <strong>{area.toFixed(2)} mm²</strong>
      </figcaption>
    </figure>
  );
}

function Meter({ trial, status, accent }: { trial: Trial | null; status: "measured" | "ready" | "none" | "fixed"; accent: boolean }) {
  return (
    <div className={`meter ${accent ? "meter-accent" : ""} ${status === "ready" ? "meter-stale" : ""}`}>
      <div className="meter-head">
        <span>Current meter</span>
        {status === "ready" && <span className="badge badge-ready">{UI.readyToTest}</span>}
        {status === "measured" && <span className="badge badge-ok">Measured</span>}
        {status === "fixed" && <span className="badge">Measured</span>}
      </div>
      <div className="meter-value" aria-live="off">
        {trial ? fmtmA(trial.current) : "– –.– –"}
        <span className="unit">mA</span>
      </div>
      <div className="meter-sub">
        {trial ? (
          <>
            {status === "ready" ? `${UI.lastReading} (${trial.label}): ` : `${trial.label}: `}
            {describe(trial.settings)} · R = {fmtOhm(trial.resistance)} Ω
          </>
        ) : (
          UI.notTested
        )}
      </div>
    </div>
  );
}

export function Rig({
  title,
  settings,
  trial,
  status,
  accent,
  refArea,
}: {
  title: string;
  settings: WireSettings;
  trial: Trial | null;
  status: "measured" | "ready" | "none" | "fixed";
  accent: boolean;
  refArea?: number;
}) {
  return (
    <section className={`rig ${accent ? "rig-accent" : ""}`} aria-label={title}>
      <header className="rig-title">
        <span className={`dot ${accent ? "dot-accent" : ""}`} aria-hidden="true" />
        {title}
      </header>
      <div className="rig-settings">
        <span>{MATERIALS[settings.material].label}</span>
        <span>L = {settings.length.toFixed(2)} m</span>
        <span>A = {settings.area.toFixed(2)} mm²</span>
      </div>
      <div className="rig-body">
        <WireDiagram w={settings} accent={accent} title={title} />
        <EndView area={settings.area} accent={accent} refArea={refArea} />
      </div>
      <Meter trial={trial} status={status} accent={accent} />
    </section>
  );
}

function Segmented<T extends string | number>({
  label,
  name,
  options,
  value,
  onChange,
  format,
  disabled,
}: {
  label: string;
  name: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format: (v: T) => string;
  disabled?: boolean;
}) {
  return (
    <fieldset className="seg" disabled={disabled}>
      <legend>{label}</legend>
      <div className="seg-row">
        {options.map((o) => (
          <label key={String(o)} className={`seg-opt ${o === value ? "on" : ""}`}>
            <input type="radio" name={name} value={String(o)} checked={o === value} onChange={() => onChange(o)} />
            <span>{format(o)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface BenchProps {
  draft: WireSettings;
  lastTested: WireSettings | null;
  lastTrial: Trial | null;
  referenceTrial: Trial;
  referenceTitle?: string;
  onChange: (p: Property, v: string | number) => void;
  controlsDisabled?: boolean;
  disabledNote?: string;
  locked?: Record<Property, boolean>;
  onToggleLock?: (p: Property) => void;
}

export function Bench(props: BenchProps) {
  const { draft, lastTested, lastTrial, referenceTrial, onChange, controlsDisabled, locked } = props;
  const status = !lastTrial ? "none" : sameSettings(draft, lastTested) ? "measured" : "ready";
  const lockBox = (p: Property) =>
    props.onToggleLock ? (
      <label className="lock">
        <input type="checkbox" checked={!!locked?.[p]} onChange={() => props.onToggleLock!(p)} /> Lock
      </label>
    ) : null;
  return (
    <div className="bench">
      <p className="bench-note">{RIG_LABELS.sameVoltage}</p>
      <div className="rigs">
        <Rig
          title={props.referenceTitle ?? RIG_LABELS.reference}
          settings={referenceTrial.settings}
          trial={referenceTrial}
          status="fixed"
          accent={false}
        />
        <Rig
          title={RIG_LABELS.test}
          settings={draft}
          trial={lastTrial}
          status={status}
          accent
          refArea={referenceTrial.settings.area}
        />
      </div>
      <div className="controls" aria-label="Test wire controls">
        <div className="controls-head">
          <strong>Adjust your test wire</strong>
          {controlsDisabled && props.disabledNote && <span className="muted">{props.disabledNote}</span>}
        </div>
        <div className="ctl">
          <Segmented
            label="Material"
            name="material"
            options={MATERIAL_IDS}
            value={draft.material}
            onChange={(v) => onChange("material", v)}
            format={(v) => MATERIALS[v].label}
            disabled={controlsDisabled || locked?.material}
          />
          {lockBox("material")}
        </div>
        <div className="ctl">
          <Segmented
            label="Length (m)"
            name="length"
            options={LENGTHS_M}
            value={draft.length}
            onChange={(v) => onChange("length", v)}
            format={(v) => v.toFixed(2)}
            disabled={controlsDisabled || locked?.length}
          />
          {lockBox("length")}
        </div>
        <div className="ctl">
          <Segmented
            label="Cross-sectional area (mm²)"
            name="area"
            options={AREAS_MM2}
            value={draft.area}
            onChange={(v) => onChange("area", v)}
            format={(v) => v.toFixed(2)}
            disabled={controlsDisabled || locked?.area}
          />
          {lockBox("area")}
        </div>
        <p className="sr-only" aria-live="polite">
          Test wire set to {describe(draft)}. {status === "ready" ? "Ready to test." : ""}
        </p>
      </div>
      <p className="assume">Ideal model: {VOLTAGE_V.toFixed(2)} V fixed, constant temperature, ideal meter.</p>
    </div>
  );
}
