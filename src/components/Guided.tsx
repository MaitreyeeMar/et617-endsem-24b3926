"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  BENCH_TEXT, BRANCH_INTRO, CHALLENGE, LOOP_TEXT, DIRECTION_LABEL, FAIR_TASK, FORMULA_REVEAL, MATERIAL_TASK, MYSTERY_TASK,
  PREDICT_TASKS, TASKS, TASK_ORDER, TRANSFER, UI, BUILT_IN_NOTICE, type ReasonChip, type TaskId,
} from "@/config/content";
import { MATERIALS, REFERENCE_WIRE } from "@/config/physics";
import {
  changedProperties, currentsMatch, direction, fmtmA, fmtOhm, measure, sameSettings, type Direction, type Property,
} from "@/lib/physics";
import { findTrial, makeTrial, newTaskState, reference, type AppState, type FeedbackMsg, type TaskState, type Trial } from "@/lib/state";
import { resetDraft, saveTrial, setDraft, type Updater } from "@/lib/actions";
import { branchFor, classifyReasonText, describeTrial, getExplanationFeedback, listProps, trialName } from "@/lib/feedback";
import { Bench, type CompareSpec } from "./Bench";

type P = { s: AppState; update: Updater };

export function ActionBar({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <div className="actionbar">{children}</div>;
}

export function Feedback({ f }: { f: FeedbackMsg | null }) {
  if (!f) return null;
  return (
    <div className={`fb fb-${f.tone}`} role="status">
      {f.source === "built-in" && <span className="fb-src">{BUILT_IN_NOTICE}</span>}
      {f.source === "ai" && <span className="fb-src fb-src-ai">AI-checked follow-up</span>}
      <p>{f.text}</p>
    </div>
  );
}

function Clues({ clues, shown, onMore }: { clues: readonly string[]; shown: number; onMore: () => void }) {
  return (
    <div className="clues">
      {clues.slice(0, shown).map((c, i) => (
        <p key={i} className="clue">💡 {c}</p>
      ))}
      {shown < clues.length && (
        <button className="link" onClick={onMore}>{shown === 0 ? "Show a clue (optional)" : "Another clue"}</button>
      )}
    </div>
  );
}

function Progress({ index }: { index: number }) {
  return (
    <div className="progress" aria-label={`Task ${Math.min(index + 1, 5)} of 5`}>
      <span className="progress-label">{index < 5 ? `Task ${index + 1} of 5` : index === 5 ? "Quick check" : "Finished"}</span>
      <ol className="progress-dots" aria-hidden="true">
        {TASK_ORDER.map((t, i) => (
          <li key={t} className={i < index ? "done" : i === index ? "now" : ""} />
        ))}
      </ol>
    </div>
  );
}

function ReasonPicker({ chips, chosen, draft, onChip, onDraft, label }: {
  chips: readonly ReasonChip[]; chosen: string | null; draft: string; label: string;
  onChip: (c: ReasonChip) => void; onDraft: (v: string) => void;
}) {
  return (
    <fieldset className="reason">
      <legend>{label}</legend>
      <div className="chips">
        {chips.map((c) => (
          <button key={c.id} type="button" className={`chip ${chosen === c.id ? "on" : ""}`} aria-pressed={chosen === c.id} onClick={() => onChip(c)}>
            {c.text}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Or in your own words</span>
        <textarea rows={2} value={draft} onChange={(e) => onDraft(e.target.value)} placeholder="Because…" />
      </label>
    </fieldset>
  );
}

function DirectionPicker({ value, onChange, name }: { value: Direction | null; onChange: (d: Direction) => void; name: string }) {
  return (
    <div className="choice-row" role="radiogroup" aria-label="Your prediction">
      {(["increase", "decrease", "same"] as Direction[]).map((d) => (
        <label key={d} className={`choice ${value === d ? "on" : ""}`}>
          <input type="radio" name={name} checked={value === d} onChange={() => onChange(d)} />
          <span>{d === "increase" ? "↑ " : d === "decrease" ? "↓ " : "= "}{DIRECTION_LABEL[d]}</span>
        </label>
      ))}
    </div>
  );
}

function TrialPicker({ trials, selected, onToggle, max = 2 }: { trials: Trial[]; selected: string[]; onToggle: (id: string) => void; max?: number }) {
  return (
    <div className="trial-pick">
      {trials.map((t) => {
        const on = selected.includes(t.id);
        return (
          <label key={t.id} className={`trial-chip ${on ? "on" : ""}`}>
            <input type="checkbox" checked={on} disabled={!on && selected.length >= max} onChange={() => onToggle(t.id)} />
            <span>{describeTrial(t)}{t.note ? ` · ${t.note}` : ""}</span>
          </label>
        );
      })}
    </div>
  );
}

function CompareCard({ a, b }: { a: Trial; b: Trial }) {
  const ch = changedProperties(a.settings, b.settings);
  const same = (["material", "length", "area"] as Property[]).filter((p) => !ch.includes(p));
  const hi = a.current > b.current ? a : b;
  return (
    <div className="compare" aria-label="Comparison of two trials">
      {[a, b].map((t) => (
        <div key={t.id} className={`cmp ${t.id === b.id ? "cmp-accent" : ""}`}>
          <div className="cmp-label">{trialName(t)}</div>
          <div className="cmp-val">{fmtmA(t.current)} <span>mA</span></div>
          <div className="cmp-set">{MATERIALS[t.settings.material].label} · {t.settings.length.toFixed(2)} m · {t.settings.area.toFixed(2)} mm²</div>
        </div>
      ))}
      <p className="cmp-text">
        Changed: <strong>{listProps(ch)}</strong>. Same: {listProps(same)}, voltage.
        {!currentsMatch(a.current, b.current) ? ` More current: ${trialName(hi).toLowerCase()}.` : " Both readings match."}
      </p>
    </div>
  );
}

function Formula() {
  return (
    <aside className="formula" aria-label="Formula">
      <div className="formula-title">{FORMULA_REVEAL.title}</div>
      <div className="formula-eq">{FORMULA_REVEAL.formula}</div>
      <p>{FORMULA_REVEAL.body}</p>
    </aside>
  );
}

export function Guided({ s, update }: P) {
  const g = s.guided;
  const ref = reference(s);
  const [busy, setBusy] = useState(false);
  const stageKey = !g.started ? "intro" : g.index < 5 ? `${g.index}-${g.tasks[TASK_ORDER[g.index]].stage}-${g.tasks[TASK_ORDER[g.index]].planOk ? 1 : 0}` : String(g.index);
  useEffect(() => {
    if (stageKey !== "intro") window.scrollTo({ top: 0 });
  }, [stageKey]);

  const benchFor = (
    unlocked: Property[],
    note?: string,
    saved: Trial[] = [],
    opts: { focus?: Property; compare?: CompareSpec; stepText?: string; inlineAction?: ReactNode; highlight?: Property; areaHint?: string } = {},
  ) => (
    <Bench
      focus={opts.focus}
      compare={opts.compare}
      stepText={opts.stepText}
      inlineAction={opts.inlineAction}
      highlight={opts.highlight}
      areaHint={opts.areaHint}
      draft={s.draft}
      referenceTrial={ref}
      referenceLabel={BENCH_TEXT.referenceLabel}
      onChange={(p, v) => update((d) => setDraft(d, p, v))}
      unlocked={unlocked}
      lockedNote={unlocked.length === 0 ? note : BENCH_TEXT.saveHint}
      savedTrials={saved}
    />
  );

  // ── Opening: the instrument + challenge ──
  if (!g.started) {
    return (
      <div className="layout">
        <section className="panel task">
          <p className="eyebrow">Inquiry lab · Class 10 · about 8 minutes</p>
          <h1 className="challenge">{CHALLENGE}</h1>
          <p>The dashed outline is the reference wire: nichrome, 1.00 m, 0.50 mm². The solid wire is yours to change with the sliders. Both get the same 0.10 V.</p>
          <p className="muted">{UI.privacy} You can stop at any time — your place is saved.</p>
          <button className="btn btn-primary start-btn" onClick={() => update((d) => void (d.guided.started = true))}>Start Task 1</button>
        </section>
        {benchFor([], "Sliders unlock in Task 1")}
      </div>
    );
  }

  if (g.index === 5) return <Transfer s={s} update={update} />;
  if (g.index >= 6) return <Finished s={s} update={update} />;

  const id = TASK_ORDER[g.index];
  const t = g.tasks[id];
  const patch = (fn: (t: TaskState, d: AppState) => void) => update((d) => fn(d.guided.tasks[id], d));
  const next = () =>
    update((d) => {
      d.guided.tasks[id].done = true;
      d.guided.index += 1;
      const nid = TASK_ORDER[d.guided.index];
      if (nid === "fair" && !d.trials.some((x) => x.id === "G1")) {
        FAIR_TASK.given.forEach((gv, i) => d.trials.push(makeTrial(gv.id, gv.id, -1 - i, gv.settings, "given")));
      }
      if (nid) resetDraft(d, REFERENCE_WIRE);
    });
  const clues =
    id === "length" || id === "area" ? PREDICT_TASKS[id].clues : id === "material" ? MATERIAL_TASK.clues : id === "mystery" ? MYSTERY_TASK.clues : [];
  const clueBox = clues.length > 0 && <Clues clues={clues} shown={t.hints} onMore={() => patch((tt) => void (tt.hints += 1))} />;

  let body: ReactNode = null;
  let action: ReactNode = null;
  let unlocked: Property[] = [];
  let benchNote: string = BENCH_TEXT.locked;
  let stepText: string | undefined;
  let layoutBenchFirst = false;
  let showBars = false;

  // ── Tasks 1 & 2: predict → (plan) → test → observe → [revise] → explain + fresh prediction ──
  // Adapts on two signals: the saved prediction/reason (branch) and the learner's actions on this task
  // (observation misses, help requests). A help request never changes the branch.
  if (id === "length" || id === "area") {
    const cfg = PREDICT_TASKS[id];
    const T = LOOP_TEXT;
    const testTrial = findTrial(s, t.trialIds[t.trialIds.length - 1]);
    const support = t.support ?? 0;
    const others = (["material", "length", "area"] as Property[]).filter((p) => p !== id);
    const propWord = (p: Property) => (p === "area" ? "area (thickness)" : p);
    if (t.stage === "predict") {
      const reasonText = t.reasonDraft.trim() || cfg.chips.find((c) => c.id === t.reasonChip)?.text || "";
      body = (
        <>
          <h2>{cfg.question}</h2>
          {cfg.firstUse && <p className="first-use">{cfg.firstUse}</p>}
          <DirectionPicker name={`pred-${id}`} value={t.prediction} onChange={(v) => patch((tt) => void (tt.prediction = v))} />
          <ReasonPicker
            label="Why do you think so?"
            chips={cfg.chips}
            chosen={t.reasonChip}
            draft={t.reasonDraft}
            onChip={(c) => patch((tt) => void (tt.reasonChip = tt.reasonChip === c.id ? null : c.id))}
            onDraft={(v) => patch((tt) => void (tt.reasonDraft = v))}
          />
        </>
      );
      action = (
        <button
          className="btn btn-primary"
          disabled={!t.prediction || !reasonText}
          onClick={() =>
            patch((tt) => {
              const chip = cfg.chips.find((c) => c.id === tt.reasonChip);
              const kind = tt.reasonDraft.trim() ? classifyReasonText(id, tt.reasonDraft) : chip?.kind ?? "unsure";
              tt.savedReason = reasonText; // saved BEFORE the experiment
              tt.branch = branchFor(tt.prediction === cfg.correct, kind);
              tt.stage = "test";
              tt.feedback = { tone: "info", text: BRANCH_INTRO[tt.branch] };
            })
          }
        >
          Save prediction
        </button>
      );
    } else if (t.stage === "test" && t.branch === "sound" && !t.planOk) {
      // Sound reasoning → independent fair test: the learner chooses what to hold fixed.
      const plan = t.plan ?? [];
      body = (
        <>
          <p className="saved-pred">You predicted: <strong>{DIRECTION_LABEL[t.prediction!]}</strong> — “{t.savedReason}”</p>
          <h2>{cfg.planPrompt}</h2>
          <fieldset className="checks">
            <legend>{T.planLegend}</legend>
            {(["material", "length", "area"] as Property[]).map((p) => (
              <label key={p} className="check">
                <input type="checkbox" checked={plan.includes(p)}
                  onChange={() => patch((tt) => { const pl = tt.plan ?? []; tt.plan = pl.includes(p) ? pl.filter((x) => x !== p) : [...pl, p]; })} />
                {p === "material" ? "Material" : p === "length" ? "Length" : "Area (thickness)"}
              </label>
            ))}
          </fieldset>
          <Feedback f={t.feedback} />
        </>
      );
      action = (
        <button
          className="btn btn-primary"
          disabled={plan.length === 0}
          onClick={() =>
            patch((tt) => {
              const pl = tt.plan ?? [];
              if (pl.includes(id)) tt.feedback = { tone: "nudge", text: T.planWrongIncludesTested(propWord(id)) };
              else if (!others.every((p) => pl.includes(p))) tt.feedback = { tone: "nudge", text: T.planWrongMissing };
              else {
                tt.planOk = true;
                tt.feedback = { tone: "good", text: T.planOk(others.map(propWord).join(" and "), propWord(id)) };
              }
            })
          }
        >
          Confirm my plan
        </button>
      );
    } else if (t.stage === "test") {
      unlocked = t.branch === "sound" ? ["material", "length", "area"] : [id];
      stepText = t.branch === "sound" ? cfg.independentHint : cfg.setupHint;
      body = (
        <>
          <p className="saved-pred">You predicted: <strong>{DIRECTION_LABEL[t.prediction!]}</strong> — “{t.savedReason}”</p>
          <Feedback f={t.feedback} />
          <p className="instruction">{stepText}</p>
        </>
      );
      action = (
        <button
          className="btn btn-primary"
          onClick={() =>
            update((d) => {
              const tt = d.guided.tasks[id];
              const tr = saveTrial(d, id);
              tt.trialIds.push(tr.id);
              const ch = changedProperties(REFERENCE_WIRE, tr.settings);
              if (sameSettings(tr.settings, cfg.target)) {
                tt.feedback = { tone: "info", text: T.afterSave };
                tt.stage = "compare";
                tt.viewing = "trial";
                tt.higher = null;
              } else if (!ch.includes(id)) {
                tt.feedback = { tone: "nudge", text: `This trial did not change the ${propWord(id)}. ${cfg.setupHint}` };
              } else if (ch.length > 1) {
                tt.feedback = { tone: "nudge", text: `This trial also changed the ${listProps(ch.filter((p) => p !== id))}. Change only the ${propWord(id)}, so the test is fair.` };
              } else {
                tt.feedback = { tone: "nudge", text: `Only the ${propWord(id)} changed — good. This task needs it doubled. ${cfg.setupHint}` };
              }
            })
          }
        >
          Save trial
        </button>
      );
    } else if (t.stage === "compare" && testTrial) {
      layoutBenchFirst = true;
      showBars = support >= 2;
      const simple = support >= 2 && !t.simpleDone;
      const a = fmtmA(ref.current), b = fmtmA(testTrial.current);
      body = (
        <>
          <p className="saved-pred">You predicted: <strong>{DIRECTION_LABEL[t.prediction!]}</strong> — “{t.savedReason}”</p>
          <Feedback f={t.feedback} />
          {simple ? (
            <>
              <h2>{T.simpleQuestion}</h2>
              <div className="choice-col" role="radiogroup" aria-label={T.simpleQuestion}>
                {([["reference", T.simpleOriginal], ["test", T.simpleTest]] as const).map(([v, label]) => (
                  <label key={v} className={`choice ${t.simpleAnswer === v ? "on" : ""}`}>
                    <input type="radio" name={`simple-${id}`} checked={t.simpleAnswer === v} onChange={() => patch((tt) => void (tt.simpleAnswer = v))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>{T.observeQuestion}</h2>
              <div className="choice-col" role="radiogroup" aria-label={T.observeQuestion}>
                {([["reference", T.observeOriginal], ["test", T.observeTest]] as const).map(([v, label]) => (
                  <label key={v} className={`choice ${t.higher === v ? "on" : ""}`}>
                    <input type="radio" name={`hi-${id}`} checked={t.higher === v} onChange={() => patch((tt) => void (tt.higher = v))} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {support < 2 && (
                <button className="link" onClick={() => patch((tt) => { tt.helpRequested = true; tt.support = 2; tt.simpleDone = false; tt.simpleAnswer = null; tt.feedback = { tone: "info", text: T.miss2 }; })}>
                  {T.moreHelp}
                </button>
              )}
            </>
          )}
        </>
      );
      action = simple ? (
        <button
          className="btn btn-primary"
          disabled={!t.simpleAnswer}
          onClick={() =>
            patch((tt) => {
              if (tt.simpleAnswer === cfg.observedHigher) {
                tt.simpleDone = true;
                tt.higher = null; // return to the original question, answered independently
                tt.feedback = { tone: "good", text: T.simpleRight };
              } else tt.feedback = { tone: "nudge", text: T.simpleWrong };
            })
          }
        >
          {t.simpleAnswer ? T.check : T.chooseFirst}
        </button>
      ) : (
        <button
          className="btn btn-primary"
          disabled={!t.higher}
          onClick={() =>
            update((d) => {
              const tt = d.guided.tasks[id];
              if (tt.higher === cfg.observedHigher) {
                const observed = direction(reference(d).current, testTrial.current);
                const chip = cfg.chips.find((c) => c.id === tt.reasonChip);
                const kind = tt.reasonDraft.trim() ? classifyReasonText(id, tt.reasonDraft) : chip?.kind ?? "unsure";
                tt.mismatch = tt.prediction !== observed || kind === "length_misconception" || kind === "area_misconception";
                tt.feedback = { tone: "good", text: T.observeRight(cfg.observedHigher === "reference" ? "the original wire" : "your test wire") };
                if (id === "length") d.guided.formulaRevealed = true;
                tt.stage = tt.mismatch ? "revise" : "fresh";
              } else {
                tt.misses = (tt.misses ?? 0) + 1;
                tt.higher = null;
                if (tt.misses === 1) {
                  tt.support = Math.max(tt.support ?? 0, 1);
                  tt.feedback = { tone: "nudge", text: T.miss1(a, b) };
                } else {
                  tt.support = 2;
                  tt.simpleDone = false;
                  tt.simpleAnswer = null;
                  tt.feedback = { tone: "info", text: T.miss2 };
                }
              }
            })
          }
        >
          {t.higher ? T.check : T.chooseFirst}
        </button>
      );
    } else if (t.stage === "revise" && testTrial) {
      showBars = true;
      body = (
        <>
          <Feedback f={t.feedback} />
          <div className="loop-summary">
            <div><span className="muted">You predicted</span><p><strong>{DIRECTION_LABEL[t.prediction!]}</strong> — “{t.savedReason}”</p></div>
            <div><span className="muted">The meter showed</span><p>Original wire <strong className="mono">{fmtmA(ref.current)} mA</strong> · My test wire <strong className="mono">{fmtmA(testTrial.current)} mA</strong></p></div>
          </div>
          <h2>{T.reviseQuestion}</h2>
          <label className="field">
            <span className="sr-only">{T.reviseQuestion}</span>
            <textarea rows={3} value={t.revisedDraft} onChange={(e) => patch((tt) => void (tt.revisedDraft = e.target.value))} placeholder="Write in your own words" />
          </label>
          {!t.revisedDraft.trim() && (
            <button className="link" onClick={() => patch((tt) => void (tt.revisedDraft = T.reviseStarter))}>{T.useStarter}: “{T.reviseStarter}”</button>
          )}
        </>
      );
      action = (
        <button
          className="btn btn-primary"
          disabled={busy || t.revisedDraft.replace(/_+/g, "").trim().length < 12 || t.revisedDraft.includes("___")}
          onClick={async () => {
            setBusy(true);
            const fb = await getExplanationFeedback(id, t.revisedDraft, [ref, testTrial]);
            setBusy(false);
            patch((tt) => {
              tt.revisedClaim = tt.revisedDraft.trim();
              tt.followUp = fb;
              tt.stage = "fresh";
            });
          }}
        >
          {busy ? "Checking…" : T.saveRevision}
        </button>
      );
    } else {
      // fresh (and legacy "done"/"result"): explanation, then one fresh prediction before its result.
      showBars = true;
      const fr = cfg.fresh;
      const actual = direction(measure(fr.from).current, measure(fr.to).current);
      body = (
        <>
          <Feedback f={{ tone: "good", text: (t.mismatch ? "" : T.matched + " ") + cfg.explain }} />
          <details className="calc"><summary>{T.seeCalc}</summary><p>{cfg.calc}</p></details>
          {t.revisedClaim && (
            <div className="pair">
              <div><span className="muted">Your first idea</span><p>“{t.savedReason}”</p></div>
              <div><span className="muted">Your revised explanation</span><p>“{t.revisedClaim}”</p></div>
            </div>
          )}
          <Feedback f={t.followUp} />
          {t.revisedClaim && <button className="link" onClick={() => patch((tt) => void (tt.stage = "revise"))}>Edit my explanation</button>}
          <div className="fresh">
            <h3>{T.freshTitle}</h3>
            <p>{fr.text}</p>
            <DirectionPicker name={`fresh-${id}`} value={t.freshAnswer ?? null} onChange={(v) => !t.freshChecked && patch((tt) => void (tt.freshAnswer = v))} />
            {t.freshChecked && (
              <p className={`fb ${t.freshAnswer === actual ? "fb-good" : "fb-nudge"}`}>
                {t.freshAnswer === actual ? T.freshRight : T.freshWrong} The meter would read {fmtmA(measure(fr.from).current)} mA → {fmtmA(measure(fr.to).current)} mA ({DIRECTION_LABEL[actual].toLowerCase()}).
              </p>
            )}
          </div>
        </>
      );
      action = !t.freshChecked ? (
        <button className="btn btn-primary" disabled={!t.freshAnswer} onClick={() => patch((tt) => void (tt.freshChecked = true))}>{t.freshAnswer ? T.freshCheck : T.chooseFirst}</button>
      ) : (
        <button className="btn btn-primary" onClick={next}>Next task →</button>
      );
    }
  }

  // ── Task 3: material ──
  if (id === "material") {
    const pool = [ref, ...t.trialIds.map((x) => findTrial(s, x)).filter((x): x is Trial => !!x)];
    if (t.stage === "test") {
      unlocked = ["material"];
      stepText = MATERIAL_TASK.instruction;
      body = (
        <>
          <h2>{MATERIAL_TASK.instruction}</h2>
          <p className="muted">The original wire is already a nichrome trial. Same length and thickness.</p>
          <Feedback f={t.feedback} />
        </>
      );
      action = (
        <button
          className="btn btn-primary"
          onClick={() =>
            update((d) => {
              const tt = d.guided.tasks.material;
              const tr = saveTrial(d, "material");
              tt.trialIds.push(tr.id);
              const all = [reference(d), ...tt.trialIds.map((x) => findTrial(d, x)!)];
              const fair = all.some((a) => a.settings.material === "copper" && all.some((b) => b.settings.material === "nichrome" && changedProperties(a.settings, b.settings).length === 1));
              if (fair) {
                tt.stage = "select";
                tt.feedback = { tone: "good", text: `The ${trialName(tr).toLowerCase()} reads ${fmtmA(tr.current)} mA. The original nichrome wire reads ${fmtmA(reference(d).current)} mA. Same length and thickness — a fair pair.` };
              } else {
                tt.feedback = {
                  tone: "info",
                  text: `This wire reads ${fmtmA(tr.current)} mA (${MATERIALS[tr.settings.material].label}). ${tr.settings.material === "copper" ? "Keep the same length and thickness as the original wire." : "Now slide to copper."}`,
                };
              }
            })
          }
        >
          Save trial
        </button>
      );
    } else if (t.stage === "select") {
      body = (
        <>
          <h2>{MATERIAL_TASK.selectPrompt}</h2>
          <TrialPicker trials={pool} selected={t.evidenceIds} onToggle={(x) => patch((tt) => void (tt.evidenceIds = tt.evidenceIds.includes(x) ? tt.evidenceIds.filter((y) => y !== x) : [...tt.evidenceIds, x]))} />
          <Feedback f={t.feedback} />
          <button className="link" onClick={() => patch((tt) => void (tt.stage = "test"))}>Run another trial first</button>
        </>
      );
      benchNote = "Pick from your trials";
      action = (
        <button
          className="btn btn-primary"
          disabled={t.evidenceIds.length !== 2}
          onClick={() =>
            update((d) => {
              const tt = d.guided.tasks.material;
              const [a, b] = tt.evidenceIds.map((x) => findTrial(d, x)!);
              const ch = changedProperties(a.settings, b.settings);
              if (ch.length === 1 && ch[0] === "material") {
                tt.feedback = { tone: "good", text: MATERIAL_TASK.feedback.good };
                tt.stage = "claim";
              } else if (!ch.includes("material")) tt.feedback = { tone: "nudge", text: MATERIAL_TASK.feedback.sameMaterial };
              else tt.feedback = { tone: "nudge", text: MATERIAL_TASK.feedback.notFair(listProps(ch.filter((p) => p !== "material"))) };
            })
          }
        >
          Compare trials
        </button>
      );
    } else {
      const [a, b] = t.evidenceIds.map((x) => findTrial(s, x)!);
      body = (
        <>
          {a && b && <CompareCard a={a} b={b} />}
          <h2>{MATERIAL_TASK.claimQuestion}</h2>
          <div className="choice-col" role="radiogroup">
            {MATERIAL_TASK.claims.map((c) => (
              <label key={c.id} className={`choice ${t.choice === c.id ? "on" : ""}`}>
                <input type="radio" name="mat-claim" checked={t.choice === c.id} disabled={t.stage === "done"} onChange={() => patch((tt) => void (tt.choice = c.id))} />
                <span>{c.text}</span>
              </label>
            ))}
          </div>
          <Feedback f={t.feedback} />
        </>
      );
      action =
        t.stage === "done" ? (
          <button className="btn btn-primary" onClick={next}>Next task →</button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={!t.choice}
            onClick={() =>
              patch((tt) => {
                const ok = MATERIAL_TASK.claims.find((c) => c.id === tt.choice)?.correct;
                tt.feedback = { tone: ok ? "good" : "nudge", text: ok ? MATERIAL_TASK.feedback.claimRight : MATERIAL_TASK.feedback.claimWrong };
                if (ok) {
                  tt.revisedClaim = MATERIAL_TASK.claims.find((c) => c.id === tt.choice)!.text;
                  tt.stage = "done";
                }
              })
            }
          >
            Save claim
          </button>
        );
    }
  }

  // ── Task 4: confounded comparison ──
  if (id === "fair") {
    const g1 = findTrial(s, "G1")!;
    const g2 = findTrial(s, "G2")!;
    if (t.stage === "judge") {
      body = (
        <>
          {g1 && g2 && <CompareCard a={g1} b={g2} />}
          <h2>{FAIR_TASK.question}</h2>
          <div className="choice-row" role="radiogroup" aria-label="Isolates length?">
            {["yes", "no"].map((v) => (
              <label key={v} className={`choice ${t.choice === v ? "on" : ""}`}>
                <input type="radio" name="fair" checked={t.choice === v} onChange={() => patch((tt) => void (tt.choice = v))} />
                <span>{v === "yes" ? "Yes, it isolates length" : "No, it does not"}</span>
              </label>
            ))}
          </div>
          <fieldset className="checks">
            <legend>{FAIR_TASK.changedQuestion}</legend>
            {(["material", "length", "area"] as Property[]).map((p) => (
              <label key={p} className="check">
                <input type="checkbox" checked={t.changed.includes(p)} onChange={() => patch((tt) => void (tt.changed = tt.changed.includes(p) ? tt.changed.filter((x) => x !== p) : [...tt.changed, p]))} />
                {p[0].toUpperCase() + p.slice(1)}
              </label>
            ))}
          </fieldset>
          <Feedback f={t.feedback} />
        </>
      );
      benchNote = "Decide first, then repair";
      action = (
        <button
          className="btn btn-primary"
          disabled={!t.choice}
          onClick={() =>
            patch((tt, d) => {
              const actual = changedProperties(g1.settings, g2.settings);
              const changedOk = actual.length === tt.changed.length && actual.every((p) => tt.changed.includes(p));
              if (tt.choice === "yes") tt.feedback = { tone: "nudge", text: FAIR_TASK.feedback.wrongYes };
              else if (!changedOk) tt.feedback = { tone: "nudge", text: FAIR_TASK.feedback.wrongChanged };
              else {
                tt.feedback = { tone: "good", text: FAIR_TASK.feedback.right };
                tt.stage = "repair";
                resetDraft(d, g2.settings);
              }
            })
          }
        >
          Compare trials
        </button>
      );
    } else {
      unlocked = t.stage === "repair" ? ["material", "length"] : [];
      const last = findTrial(s, t.trialIds[t.trialIds.length - 1]);
      body = (
        <>
          <Feedback f={t.feedback} />
          {t.stage === "repair" && <h2>{FAIR_TASK.repairPrompt}</h2>}
          {t.stage === "done" && last && <CompareCard a={g1} b={last} />}
          <p className="muted">G1: {describeTrial(g1)}</p>
        </>
      );
      action =
        t.stage === "done" ? (
          <button className="btn btn-primary" onClick={next}>Next task →</button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() =>
              update((d) => {
                const tt = d.guided.tasks.fair;
                const tr = saveTrial(d, "fair");
                tt.trialIds.push(tr.id);
                const ch = changedProperties(g1.settings, tr.settings);
                if (ch.length === 1 && ch[0] === "length") {
                  tt.feedback = { tone: "good", text: `${FAIR_TASK.repairGood} ${fmtmA(g1.current)} mA → ${fmtmA(tr.current)} mA.` };
                  tt.stage = "done";
                } else if (ch.length === 0) tt.feedback = { tone: "nudge", text: FAIR_TASK.repairSame };
                else tt.feedback = { tone: "nudge", text: FAIR_TASK.repairBad(listProps(ch.filter((p) => p !== "length"))) };
              })
            }
          >
            Save trial
          </button>
        );
    }
  }

  // ── Task 5: mystery wire ──
  if (id === "mystery") {
    const mine = t.trialIds.map((x) => findTrial(s, x)).filter((x): x is Trial => !!x);
    const isMatch = (tr: Trial) => tr.settings.material === "nichrome" && tr.settings.length === 2 && currentsMatch(tr.current, ref.current);
    const goal = (
      <div className="goal">
        <span className="muted">Goal</span>
        <p>{MYSTERY_TASK.goal}</p>
      </div>
    );
    if (t.stage === "hypothesis") {
      body = (
        <>
          <h2>{CHALLENGE}</h2>
          {goal}
          <ReasonPicker
            label={MYSTERY_TASK.hypothesisPrompt}
            chips={MYSTERY_TASK.chips}
            chosen={t.reasonChip}
            draft={t.reasonDraft}
            onChip={(c) => patch((tt) => void (tt.reasonChip = tt.reasonChip === c.id ? null : c.id))}
            onDraft={(v) => patch((tt) => void (tt.reasonDraft = v))}
          />
        </>
      );
      const txt = t.reasonDraft.trim() || MYSTERY_TASK.chips.find((c) => c.id === t.reasonChip)?.text || "";
      action = (
        <button className="btn btn-primary" disabled={!txt} onClick={() => patch((tt) => { tt.savedReason = txt; tt.stage = "test"; tt.feedback = { tone: "info", text: MYSTERY_TASK.stretchPrompt }; })}>
          Save prediction
        </button>
      );
    } else if (t.stage === "test") {
      const stretched = mine.some((x) => x.settings.length === 2);
      unlocked = !stretched ? ["length"] : (t.changed as Property[]);
      benchNote = stretched ? "Length is fixed at 2.00 m. Choose a property to unlock its slider." : BENCH_TEXT.locked;
      const failed = mine.filter((x) => !isMatch(x));
      body = (
        <>
          {goal}
          <p className="saved-pred">Your hypothesis: “{t.savedReason}”</p>
          <Feedback f={t.feedback} />
          {t.failCount > 0 && t.feedback?.tone === "nudge" && (
            <div className="next-prop">
              <h3>{MYSTERY_TASK.failQuestion}</h3>
              <div className="choice-row">
                {MYSTERY_TASK.nextChoices.map((c) => (
                  <button key={c.id} className={`chip ${t.nextChoice === c.id ? "on" : ""}`} aria-pressed={t.nextChoice === c.id} onClick={() => patch((tt) => { tt.nextChoice = c.id; if (c.id !== "length" && !tt.changed.includes(c.id)) tt.changed.push(c.id); })}>
                    {c.text}
                  </button>
                ))}
              </div>
              {t.nextChoice && <p className="fb fb-info">{MYSTERY_TASK.nextChoices.find((c) => c.id === t.nextChoice)!.reply}</p>}
            </div>
          )}
          {failed.length > 0 && (
            <div className="failed">
              <span className="muted">Your earlier runs (kept)</span>
              <ul>{failed.map((f) => <li key={f.id}>{describeTrial(f)}</li>)}</ul>
            </div>
          )}
          {t.failCount >= 2 && t.nextChoice && !t.workedShown && (
            <button className="link" onClick={() => patch((tt) => void (tt.workedShown = true))}>Show the worked answer</button>
          )}
          {t.workedShown && <p className="worked">{MYSTERY_TASK.workedAnswer}</p>}
        </>
      );
      action = (
        <button
          className="btn btn-primary"
          onClick={() =>
            update((d) => {
              const tt = d.guided.tasks.mystery;
              const wasStretched = tt.trialIds.some((x) => findTrial(d, x)?.settings.length === 2);
              const tr = saveTrial(d, "mystery");
              tt.trialIds.push(tr.id);
              const rf = reference(d);
              const notes: string[] = [];
              if (tr.settings.material !== "nichrome") notes.push(MYSTERY_TASK.constraints.material);
              if (tr.settings.length !== 2) notes.push(MYSTERY_TASK.constraints.length);
              if (notes.length === 0 && currentsMatch(tr.current, rf.current)) {
                tt.feedback = { tone: "good", text: `${MYSTERY_TASK.success} ${fmtmA(tr.current)} mA = ${fmtmA(rf.current)} mA.` };
                tt.stage = "evidence";
                tt.evidenceIds = ["REF", tr.id];
                return;
              }
              if (!wasStretched && tr.settings.length !== 2) {
                tt.feedback = { tone: "info", text: `Saved: ${fmtmA(tr.current)} mA. ${MYSTERY_TASK.stretchPrompt}` };
                return;
              }
              tt.failCount += 1;
              tt.nextChoice = null;
              tr.note = "did not match";
              const level = tr.current < rf.current ? MYSTERY_TASK.tooLow : MYSTERY_TASK.tooHigh;
              tt.feedback = { tone: "nudge", text: `Your wire: ${fmtmA(tr.current)} mA. Original wire: ${fmtmA(rf.current)} mA. ${notes.length ? notes.join(" ") : level}` };
            })
          }
        >
          Save trial
        </button>
      );
    } else if (t.stage === "evidence") {
      const pool = [ref, ...s.trials.filter((x) => x.id !== "REF" && x.context !== "given")];
      body = (
        <>
          <Feedback f={t.feedback} />
          <h2>{MYSTERY_TASK.evidencePrompt}</h2>
          <TrialPicker trials={pool} selected={t.evidenceIds} onToggle={(x) => patch((tt) => void (tt.evidenceIds = tt.evidenceIds.includes(x) ? tt.evidenceIds.filter((y) => y !== x) : [...tt.evidenceIds, x]))} />
        </>
      );
      benchNote = "Matched! Now choose your evidence";
      action = (
        <button
          className="btn btn-primary"
          disabled={t.evidenceIds.length !== 2}
          onClick={() =>
            update((d) => {
              const tt = d.guided.tasks.mystery;
              const ev = tt.evidenceIds.map((x) => findTrial(d, x)!);
              if (!ev.some(isMatch)) tt.feedback = { tone: "nudge", text: MYSTERY_TASK.evidenceNeedMatch };
              else {
                tt.feedback = { tone: "good", text: MYSTERY_TASK.evidenceGood };
                tt.stage = "explain";
                if (!tt.revisedDraft) tt.revisedDraft = MYSTERY_TASK.explainStarter;
              }
            })
          }
        >
          Compare trials
        </button>
      );
    } else {
      const ev = t.evidenceIds.map((x) => findTrial(s, x)).filter((x): x is Trial => !!x);
      const editing = t.stage === "explain";
      body = (
        <>
          {ev.length === 2 && <CompareCard a={ev[0]} b={ev[1]} />}
          <div className="pair">
            <div><span className="muted">Your hypothesis</span><p>“{t.savedReason}”</p></div>
            {t.revisedClaim && !editing && <div><span className="muted">Your explanation</span><p>“{t.revisedClaim}”</p></div>}
          </div>
          {editing ? (
            <label className="field">
              <span>{MYSTERY_TASK.explainPrompt}</span>
              <textarea rows={3} value={t.revisedDraft} onChange={(e) => patch((tt) => void (tt.revisedDraft = e.target.value))} />
            </label>
          ) : (
            <>
              <Feedback f={t.followUp} />
              <button className="link" onClick={() => patch((tt) => void (tt.stage = "explain"))}>Revise my explanation</button>
            </>
          )}
        </>
      );
      action = editing ? (
        <button
          className="btn btn-primary"
          disabled={busy || t.revisedDraft.trim().length < MYSTERY_TASK.explainStarter.length + 3}
          onClick={async () => {
            setBusy(true);
            const fb = await getExplanationFeedback("mystery", t.revisedDraft, ev);
            setBusy(false);
            patch((tt) => { tt.revisedClaim = tt.revisedDraft; tt.followUp = fb; tt.stage = "explained"; });
          }}
        >
          {busy ? "Checking…" : t.revisedClaim ? "Revise claim" : "Check explanation"}
        </button>
      ) : (
        <button className="btn btn-primary" onClick={() => update((d) => { d.guided.tasks.mystery.done = true; d.guided.index = 6; d.guided.finishedAt = Date.now(); })}>Finish →</button>
      );
    }
  }

  // Single-variable tasks: one slider directly under the circuit.
  const singleProp: Property | undefined = id === "length" || id === "area" ? id : id === "material" ? "material" : undefined;
  const focus: Property | undefined = unlocked.length === 1 ? unlocked[0] : unlocked.length === 0 ? singleProp : undefined;
  // "Original wire | My trial" switch: reads two saved snapshots, never the draft.
  let compare: CompareSpec | undefined;
  if ((id === "length" || id === "area") && t.stage !== "predict" && t.stage !== "test") {
    const tr = findTrial(s, t.trialIds[t.trialIds.length - 1]);
    if (tr) compare = { original: ref, trial: tr, viewing: t.viewing ?? "trial", onSwitch: (v) => patch((tt) => void (tt.viewing = v)), showBars };
  }
  // Single-variable test: "Save trial" sits beside the active slider and meter.
  let inlineAction: ReactNode = null;
  if (focus && unlocked.length === 1 && unlocked[0] === focus) {
    inlineAction = action;
    action = null;
    layoutBenchFirst = true;
  }
  const highlight: Property | undefined = focus && unlocked.length === 1 ? focus : undefined;

  return (
    <div className={`layout ${layoutBenchFirst ? "bench-first" : ""}`}>
      <section className="panel task" aria-labelledby="task-title">
        <Progress index={g.index} />
        <p className="eyebrow" id="task-title">{TASKS[id].title}</p>
        {body}
        {clueBox}
        {g.formulaRevealed && id !== "length" && <Formula />}
        {g.formulaRevealed && id === "length" && t.stage !== "test" && <Formula />}
      </section>
      {benchFor(unlocked, benchNote, t.trialIds.map((x) => findTrial(s, x)).filter((x): x is Trial => !!x), {
        focus, compare, stepText, inlineAction, highlight,
        areaHint: id === "area" ? PREDICT_TASKS.area.firstUse ?? undefined : undefined,
      })}
      <ActionBar>{action}</ActionBar>
    </div>
  );
}

function Transfer({ s, update }: P) {
  const tr = s.guided.transfer;
  return (
    <div className="layout">
      <section className="panel task">
        <Progress index={5} />
        <p className="eyebrow">Two quick predictions · new settings</p>
        {TRANSFER.map((q, i) => {
          const actual = direction(measure(q.from).current, measure(q.to).current);
          const ans = tr.answers[i];
          return (
            <div key={q.id} className="transfer-q">
              <h3>{i + 1}. {q.text} What happens to the current?</h3>
              <DirectionPicker name={q.id} value={ans} onChange={(v) => !tr.checked && update((d) => void (d.guided.transfer.answers[i] = v))} />
              {tr.checked && (
                <p className={`fb ${ans === actual ? "fb-good" : "fb-nudge"}`}>
                  {ans === actual ? "Correct. " : "Not quite. "}
                  Simulated: {fmtmA(measure(q.from).current)} mA → {fmtmA(measure(q.to).current)} mA ({DIRECTION_LABEL[actual].toLowerCase()}).
                </p>
              )}
            </div>
          );
        })}
      </section>
      <ActionBar>
        {!tr.checked ? (
          <button className="btn btn-primary" disabled={tr.answers.some((a) => !a)} onClick={() => update((d) => void (d.guided.transfer.checked = true))}>
            Check predictions
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => update((d) => { d.guided.index = 6; d.guided.finishedAt = Date.now(); })}>Finish</button>
        )}
      </ActionBar>
    </div>
  );
}

function Finished({ s, update }: P) {
  const mins = Math.max(1, Math.round(s.activeMs / 60000));
  const freshOk = (["length", "area"] as const).filter((k) => {
    const tk = s.guided.tasks[k];
    const f = PREDICT_TASKS[k].fresh;
    return tk.freshChecked && tk.freshAnswer === direction(measure(f.from).current, measure(f.to).current);
  }).length;
  const legacy = TRANSFER.filter((q, i) => s.guided.transfer.answers[i] === direction(measure(q.from).current, measure(q.to).current)).length;
  const correct = s.guided.transfer.checked ? legacy : freshOk;
  const m = s.guided.tasks.mystery;
  return (
    <div className="layout">
      <section className="panel task">
        <Progress index={6} />
        <h1 className="challenge">You kept the meter at 45.45 mA with a wire twice as long.</h1>
        <ul className="summary">
          <li>Fresh predictions correct: <strong>{correct} of 2</strong></li>
          <li>Mystery wire runs: <strong>{m.trialIds.length}</strong> ({m.failCount} did not match — all kept in your notebook)</li>
          <li>Time on this attempt: about <strong>{mins} min</strong></li>
        </ul>
        <p>You can now explain a meter reading: <em>longer wire → more resistance → less current; thicker wire → less resistance → more current; doubling both cancels out.</em></p>
        <div className="row">
          <button className="btn" onClick={() => update((d) => void (d.view = "notebook"))}>Open Lab Notebook</button>
          <button className="btn" onClick={() => update((d) => void (d.view = "free"))}>Explore Free Bench</button>
          <button className="btn btn-ghost" onClick={() => update((d) => { d.guided.index = 0; d.guided.tasks = Object.fromEntries(TASK_ORDER.map((x) => [x, newTaskState(x)])) as AppState["guided"]["tasks"]; d.guided.transfer = { answers: [null, null], checked: false }; })}>
            Redo guided tasks
          </button>
        </div>
      </section>
    </div>
  );
}

export type { TaskId };
