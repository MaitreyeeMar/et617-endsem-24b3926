"use client";
import { useEffect } from "react";
// Optional Notebook activity: "The Mystery Wire". Outside the five-task Guided sequence.
// Uses the same engine (measure), circuit illustration (WireScene/EndFace/LiveFormula) and theme tokens.
// Until the learner inspects, the mystery wire's length, area and formula substitution are NOT rendered.
import { MYSTERY_LAB, type MysteryCaseId } from "@/config/content";
import { MATERIALS, type WireSettings } from "@/config/physics";
import { fmtmA, flowRate, measure } from "@/lib/physics";
import { newMysteryCase, newMysteryLab, type AppState, type MysteryCaseState } from "@/lib/state";
import type { Updater } from "@/lib/actions";
import { EndFace, LiveFormula, WireScene, usePrefersReducedMotion, xFor, X0, SPAN, FACE_R_MAX } from "./Bench";
import { ActionBar, Feedback } from "./Guided";

const L = MYSTERY_LAB;
const caseLabel = (i: number) => `Mystery ${i + 1}`;

function ReadingCard({ title, current, accent }: { title: string; current: number; accent?: boolean }) {
  const { rate } = flowRate(current);
  return (
    <div className={`ml-reading ${accent ? "ml-reading-accent" : ""}`}>
      <div className="ml-r-title">{title}</div>
      <div className="ml-r-val mono">{fmtmA(current)} <span>mA</span></div>
      <div className="ml-r-sub">Flow cue {rate.toFixed(2)} dots/s</div>
    </div>
  );
}

/** Ruler view: both wires on the same length scale; thickness deliberately equal (not shown). */
function RulerCompare({ a, b }: { a: WireSettings; b: WireSettings }) {
  const rows: [string, WireSettings, string][] = [["Original", a, "var(--ink-3)"], ["Mystery", b, "var(--accent)"]];
  const ticks = [0, 0.5, 1, 1.5, 2];
  return (
    <figure className="ml-evidence">
      <svg viewBox="0 0 400 124" className="ml-svg" role="img"
        aria-label={`Ruler comparison. Original wire ${a.length.toFixed(2)} metres. Mystery wire ${b.length.toFixed(2)} metres.`}>
        {rows.map(([name, w, col], i) => {
          const y = 26 + i * 32;
          return (
            <g key={name}>
              <text x={4} y={y + 4} fontSize={11} fill="var(--ink-2)">{name}</text>
              <line x1={X0 + 20} y1={y} x2={xFor(w.length) + 20} y2={y} stroke={col} strokeWidth={8} strokeLinecap="round" />
              <text x={xFor(w.length) + 20} y={y - 8} fontSize={11} textAnchor="end" fill="var(--ink)" fontWeight={600}>{w.length.toFixed(2)} m</text>
            </g>
          );
        })}
        <rect x={X0 + 14} y={86} width={SPAN + 12} height={22} rx={4} fill="var(--ruler)" stroke="var(--line)" />
        {Array.from({ length: 41 }, (_, i) => i * 0.05).map((m) => (
          <line key={m} x1={xFor(m) + 20} y1={86} x2={xFor(m) + 20} y2={Math.abs(m * 2 - Math.round(m * 2)) < 1e-6 ? 95 : 90} stroke="var(--ink-3)" strokeWidth={0.7} />
        ))}
        {ticks.map((m) => <text key={m} x={xFor(m) + 20} y={104} fontSize={9.5} textAnchor="middle" fill="var(--ink-2)">{m.toFixed(1)} m</text>)}
      </svg>
      <figcaption className="muted small">{L.rulerNote}</figcaption>
    </figure>
  );
}

/** End-face view: both cross-sections at one scale (radius ∝ sqrt(area)); length not shown. */
function FacesCompare({ a, b }: { a: WireSettings; b: WireSettings }) {
  const R = FACE_R_MAX * 1.4;
  const rows: [string, WireSettings, boolean][] = [["Original", a, false], ["Mystery", b, true]];
  return (
    <figure className="ml-evidence">
      <svg viewBox="0 0 400 110" className="ml-svg" role="img"
        aria-label={`End face comparison at the same scale. Original ${a.area.toFixed(2)} square millimetres. Mystery ${b.area.toFixed(2)} square millimetres.`}>
        {rows.map(([name, w, acc], i) => {
          const cx = 110 + i * 180;
          const r = R * Math.sqrt(w.area);
          return (
            <g key={name}>
              <circle cx={cx} cy={50} r={R} fill="none" stroke="var(--line-strong)" strokeDasharray="3 3" />
              <circle cx={cx} cy={50} r={r} fill={acc ? "var(--accent-soft)" : "var(--wire-soft)"} stroke={acc ? "var(--accent)" : "var(--ink-3)"} strokeWidth={2} />
              <text x={cx} y={104} textAnchor="middle" fontSize={11} fill="var(--ink)"><tspan fontWeight={650}>{name}</tspan> · {w.area.toFixed(2)} mm²</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="muted small">{L.facesNote}</figcaption>
    </figure>
  );
}

/** The observations a learner can cite — built only from what they inspected. */
function observations(c: MysteryCaseState, a: WireSettings, b: WireSettings): { id: string; text: string }[] {
  const list = [{ id: "meter", text: L.meterOnlyObs }];
  if (c.inspected.includes("ruler"))
    list.push({ id: "ruler", text: a.length === b.length ? `Ruler: both wires are ${a.length.toFixed(2)} m long.` : `Ruler: the mystery wire is ${b.length.toFixed(2)} m, the original is ${a.length.toFixed(2)} m.` });
  if (c.inspected.includes("faces"))
    list.push({ id: "faces", text: a.area === b.area ? `End faces: both are ${a.area.toFixed(2)} mm².` : `End faces: the mystery wire is ${b.area.toFixed(2)} mm², the original is ${a.area.toFixed(2)} mm².` });
  return list;
}

/** Does this observation, with "exactly one property changed", support this claim? */
function supports(obs: string, claim: string, a: WireSettings, b: WireSettings): boolean {
  if (obs === "ruler") return a.length !== b.length ? claim === "length" : claim === "area";
  if (obs === "faces") return a.area !== b.area ? claim === "area" : claim === "length";
  return false;
}

export function MysteryLab({ s, update }: { s: AppState; update: Updater }) {
  const reduced = usePrefersReducedMotion();
  const lab = s.mysteryLab;
  // First open: create state (random case order, so position never hints at the answer).
  useEffect(() => {
    if (!s.mysteryLab) update((d) => void (d.mysteryLab ??= newMysteryLab()));
  }, [s.mysteryLab, update]);
  if (!lab) return null;
  const cid = lab.order[lab.active] as MysteryCaseId;
  const c = lab.cases[cid];
  const orig = L.original;
  const myst = L.cases[cid].settings;
  const mo = measure(orig), mm = measure(myst);
  const patch = (fn: (c: MysteryCaseState, d: AppState) => void) => update((d) => fn(d.mysteryLab!.cases[cid], d));
  const otherIdx = lab.active === 0 ? 1 : 0;
  const obsList = observations(c, orig, myst);
  const revealed = c.stage === "done";

  let action: React.ReactNode = null;
  let panel: React.ReactNode = null;

  if (c.stage === "ask") {
    panel = (
      <>
        <h2>{L.question}</h2>
        <div className="choice-col" role="radiogroup" aria-label={L.question}>
          {L.answers.map((a) => (
            <label key={a.id} className={`choice ${c.first === a.id ? "on" : ""}`}>
              <input type="radio" name="ml-first" checked={c.first === a.id} onChange={() => patch((cc) => void (cc.first = a.id))} />
              <span>{a.text}</span>
            </label>
          ))}
        </div>
      </>
    );
    action = (
      <button className="btn btn-primary" disabled={!c.first} onClick={() => patch((cc) => { cc.feedback = { tone: cc.first === "need" ? "good" : "info", text: L.reply[cc.first!] }; cc.stage = "inspect"; })}>
        Save answer
      </button>
    );
  } else if (c.stage === "inspect" || c.stage === "claim") {
    const inspectButtons = (
      <div className="ml-inspect">
        <span className="muted small">{L.inspectPrompt}</span>
        <div className="choice-row">
          {(["ruler", "faces"] as const).map((k) => (
            <button key={k} className={`chip ${c.inspected.includes(k) ? "on" : ""}`} aria-pressed={c.inspected.includes(k)}
              onClick={() => patch((cc) => void (!cc.inspected.includes(k) && cc.inspected.push(k)))}>
              {L.inspect[k]}{c.inspected.includes(k) ? " ✓" : ""}
            </button>
          ))}
        </div>
      </div>
    );
    panel = (
      <>
        <p className="saved-pred">You answered: <strong>{L.answers.find((a) => a.id === c.first)?.text}</strong></p>
        {c.stage === "inspect" && <Feedback f={c.feedback} />}
        {inspectButtons}
        {c.inspected.includes("ruler") && <RulerCompare a={orig} b={myst} />}
        {c.inspected.includes("faces") && <FacesCompare a={orig} b={myst} />}
        {c.stage === "claim" && (
          <>
            <fieldset className="checks-col">
              <legend>{L.claimPrompt}</legend>
              {L.claims.map((k) => (
                <label key={k.id} className={`choice ${c.claim === k.id ? "on" : ""}`}>
                  <input type="radio" name="ml-claim" checked={c.claim === k.id} onChange={() => patch((cc) => void (cc.claim = k.id))} />
                  <span>{k.text}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="checks-col">
              <legend>{L.obsPrompt}</legend>
              {obsList.map((o) => (
                <label key={o.id} className={`choice ${c.obs === o.id ? "on" : ""}`}>
                  <input type="radio" name="ml-obs" checked={c.obs === o.id} onChange={() => patch((cc) => void (cc.obs = o.id))} />
                  <span>{o.text}</span>
                </label>
              ))}
            </fieldset>
            <label className="field">
              <span>{L.sentencePrompt}</span>
              <textarea rows={2} value={c.text} onChange={(e) => patch((cc) => void (cc.text = e.target.value))} placeholder="The mystery wire's … changed, because I saw …" />
            </label>
            <Feedback f={c.feedback} />
          </>
        )}
      </>
    );
    action =
      c.stage === "inspect" ? (
        <button className="btn btn-primary" disabled={c.inspected.length === 0} onClick={() => patch((cc) => { cc.stage = "claim"; cc.feedback = null; })}>
          Make my claim
        </button>
      ) : (
        <button
          className="btn btn-primary"
          disabled={!c.claim}
          onClick={() =>
            update((d) => {
              const cc = d.mysteryLab!.cases[cid];
              if (!cc.obs) return void (cc.feedback = { tone: "nudge", text: L.feedback.needObs });
              if (cc.obs === "meter") return void (cc.feedback = { tone: "nudge", text: L.feedback.meterOnly });
              const ok = supports(cc.obs, cc.claim!, orig, myst) && cc.claim === L.cases[cid].changed;
              (d.mysteryLog ??= []).push({
                label: caseLabel(d.mysteryLab!.active),
                first: cc.first,
                inspected: [...cc.inspected],
                claim: L.claims.find((k) => k.id === cc.claim)!.text,
                observation: obsList.find((o) => o.id === cc.obs)!.text,
                text: cc.text.trim(),
                correct: ok,
                at: Date.now(),
              });
              if (ok) {
                cc.feedback = { tone: "good", text: L.feedback.right };
                cc.stage = "done";
              } else cc.feedback = { tone: "nudge", text: L.feedback.wrongClaim };
            })
          }
        >
          Save claim
        </button>
      );
  } else {
    panel = (
      <>
        <Feedback f={c.feedback} />
        <h3>{L.revealTitle}</h3>
        <LiveFormula w={myst} />
        <p>{L.revealBody}</p>
        <div className="row">
          <button className="btn" onClick={() => update((d) => { d.mysteryLab!.active = otherIdx; })}>{L.tryOther}</button>
          {lab.cases[lab.order[otherIdx] as MysteryCaseId].stage === "done" && (
            <button className="btn btn-ghost" onClick={() => update((d) => { d.mysteryLab!.cases = { X: newMysteryCase(), Y: newMysteryCase() }; d.mysteryLab!.active = 0; })}>
              Reset both mysteries
            </button>
          )}
        </div>
      </>
    );
    action = <button className="btn btn-primary" onClick={() => update((d) => void (d.notebookTab = "records"))}>{L.back}</button>;
  }

  return (
    <div className="layout ml-layout">
      <section className="panel task" aria-labelledby="ml-title">
        <div className="progress">
          <span className="progress-label">{caseLabel(lab.active)} of 2 · optional</span>
          <button className="link" onClick={() => update((d) => void (d.notebookTab = "records"))}>← Notebook records</button>
        </div>
        <p className="eyebrow" id="ml-title">{L.title}</p>
        <p className="muted small">{L.intro}</p>
        {panel}
      </section>

      <div className="bench">
        <section className="stage-card" aria-label="Mystery wire readings">
          <div className="ml-tabs" role="tablist" aria-label="Choose mystery">
            {lab.order.map((x, i) => (
              <button key={x} role="tab" aria-selected={lab.active === i} className={`tab ${lab.active === i ? "on" : ""}`} onClick={() => update((d) => void (d.mysteryLab!.active = i))}>
                {caseLabel(i)}{lab.cases[x as MysteryCaseId].stage === "done" ? " ✓" : ""}
              </button>
            ))}
          </div>
          <ul className="ml-known">{L.known.map((k) => <li key={k}>{k}</li>)}</ul>
          <div className="ml-readings">
            <ReadingCard title="Original wire · 1.00 m, 0.50 mm²" current={mo.current} />
            <ReadingCard title="Mystery wire · settings hidden" current={mm.current} accent />
          </div>
          {revealed ? (
            <div className="scene-row">
              <WireScene w={myst} ghost={orig} current={mm.current} paused={reduced} />
              <EndFace area={myst.area} refArea={orig.area} />
            </div>
          ) : (
            <div className="ml-hidden" role="img" aria-label={L.hiddenNote}>
              <span aria-hidden="true">?</span>
              <p>{L.hiddenNote}</p>
            </div>
          )}
          {revealed && <p className="muted small">Mystery wire: {MATERIALS[myst.material].label}, {myst.length.toFixed(2)} m, {myst.area.toFixed(2)} mm². Dashed outline = original.</p>}
        </section>
      </div>
      <ActionBar>{action}</ActionBar>
    </div>
  );
}
