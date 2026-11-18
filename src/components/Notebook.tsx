"use client";
import { DIRECTION_LABEL, TASKS, TASK_ORDER } from "@/config/content";
import { MATERIALS } from "@/config/physics";
import { changedProperties, currentsMatch, fmtmA, fmtOhm, type Property } from "@/lib/physics";
import { findTrial, type AppState, type Trial } from "@/lib/state";
import type { Updater } from "@/lib/actions";
import { listProps } from "@/lib/feedback";
import { MYSTERY_LAB } from "@/config/content";
import { MysteryLab } from "./MysteryLab";

const CTX: Record<string, string> = {
  reference: "Reference", given: "Given", free: "Free Bench",
  length: "Task 1", area: "Task 2", material: "Task 3", fair: "Task 4", mystery: "Task 5",
};

export function CompareView({ a, b }: { a: Trial; b: Trial }) {
  const ch = changedProperties(a.settings, b.settings);
  const same = (["material", "length", "area"] as Property[]).filter((p) => !ch.includes(p));
  const verdict =
    ch.length === 0 ? "Same wire — nothing changed." : ch.length === 1 ? `Fair comparison: only ${ch[0]} changed.` : `Not a fair test: ${listProps(ch)} changed together.`;
  return (
    <div className="compare" aria-label="Compare two runs">
      {[a, b].map((t, i) => (
        <div key={t.id} className={`cmp ${i === 1 ? "cmp-accent" : ""}`}>
          <div className="cmp-label">{t.label}</div>
          <div className="cmp-val">{fmtmA(t.current)} <span>mA</span></div>
          <div className="cmp-set">{MATERIALS[t.settings.material].label} · {t.settings.length.toFixed(2)} m · {t.settings.area.toFixed(2)} mm²</div>
          <div className="cmp-r">R = {fmtOhm(t.resistance)} Ω</div>
        </div>
      ))}
      <p className="cmp-text">
        <strong>{verdict}</strong> Stayed the same: {same.length ? listProps(same) : "none"}, voltage.{" "}
        {currentsMatch(a.current, b.current) ? "Currents match." : `${a.current > b.current ? a.label : b.label} drew more current.`}
      </p>
    </div>
  );
}

export function Notebook({ s, update }: { s: AppState; update: Updater }) {
  if (s.notebookTab === "mystery") return <MysteryLab s={s} update={update} />;
  const log = s.mysteryLog ?? [];
  const labDone = s.mysteryLab ? Object.values(s.mysteryLab.cases).filter((c) => c.stage === "done").length : 0;
  const ev = s.notebookEvidence.map((id) => findTrial(s, id)).filter((x): x is Trial => !!x);
  const toggle = (id: string) =>
    update((d) => void (d.notebookEvidence = d.notebookEvidence.includes(id) ? d.notebookEvidence.filter((x) => x !== id) : d.notebookEvidence.length >= 2 ? [d.notebookEvidence[1], id] : [...d.notebookEvidence, id]));
  return (
    <div className="layout layout-wide">
      <section className="panel ml-card">
        <div>
          <p className="eyebrow">Optional activity</p>
          <h2>{MYSTERY_LAB.title}: can the meter alone tell you what changed?</h2>
          <p className="muted small">{MYSTERY_LAB.intro} {labDone > 0 ? `${labDone} of 2 solved.` : "Two short cases."}</p>
        </div>
        <button className="btn btn-primary" onClick={() => update((d) => void (d.notebookTab = "mystery"))}>
          {s.mysteryLab ? "Continue the Mystery Wire" : "Open the Mystery Wire"}
        </button>
      </section>
      <section className="panel">
        <p className="eyebrow">Lab Notebook</p>
        <h2>Every test you ran is kept here — including the ones that did not work.</h2>
        <div className="table-wrap">
          <table className="nb">
            <caption className="sr-only">Trials</caption>
            <thead>
              <tr><th scope="col">Evidence</th><th scope="col">Trial</th><th scope="col">Where</th><th scope="col">Material</th><th scope="col">L (m)</th><th scope="col">A (mm²)</th><th scope="col">R (Ω)</th><th scope="col">I (mA)</th></tr>
            </thead>
            <tbody>
              {s.trials.map((t) => (
                <tr key={t.id} className={s.notebookEvidence.includes(t.id) ? "on" : ""}>
                  <td><input type="checkbox" aria-label={`Select ${t.label} as evidence`} checked={s.notebookEvidence.includes(t.id)} onChange={() => toggle(t.id)} /></td>
                  <td>{t.label}{t.note ? <span className="tag">{t.note}</span> : null}</td>
                  <td>{CTX[t.context] ?? t.context}</td>
                  <td>{MATERIALS[t.settings.material].label}</td>
                  <td>{t.settings.length.toFixed(2)}</td>
                  <td>{t.settings.area.toFixed(2)}</td>
                  <td>{fmtOhm(t.resistance)}</td>
                  <td className="num">{fmtmA(t.current)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ev.length === 2 ? <CompareView a={ev[0]} b={ev[1]} /> : <p className="muted">Select two trials as evidence to compare them.</p>}
      </section>
      <section className="panel">
        <h3>Predictions and revisions</h3>
        <div className="table-wrap">
          <table className="nb">
            <thead>
              <tr><th scope="col">Task</th><th scope="col">Prediction</th><th scope="col">Original explanation</th><th scope="col">Readings (original → trial)</th><th scope="col">Revised explanation</th><th scope="col">Fresh prediction</th><th scope="col">Feedback</th></tr>
            </thead>
            <tbody>
              {TASK_ORDER.map((id) => {
                const t = s.guided.tasks[id];
                if (!t.savedReason && !t.revisedClaim && t.trialIds.length === 0) return null;
                return (
                  <tr key={id}>
                    <td>{TASKS[id].short}</td>
                    <td>{t.prediction ? DIRECTION_LABEL[t.prediction] : "—"}</td>
                    <td>{t.savedReason ? `“${t.savedReason}”` : "—"}</td>
                    <td className="num">{(() => {
                      const last = findTrial(s, t.trialIds[t.trialIds.length - 1]);
                      const ref = findTrial(s, "REF")!;
                      return last ? `${fmtmA(ref.current)} → ${fmtmA(last.current)} mA (${last.label})` : "—";
                    })()}</td>
                    <td>{t.revisedClaim ? `“${t.revisedClaim}”` : "—"}</td>
                    <td>{t.freshChecked && t.freshAnswer ? DIRECTION_LABEL[t.freshAnswer] : "—"}</td>
                    <td className="small">{t.followUp ? `${t.followUp.source === "ai" ? "AI" : "Built-in"}: ${t.followUp.category ?? ""}` : "—"}</td>
                  </tr>
                );
              })}
              {s.guided.transfer.checked && (
                <tr><td>Transfer</td><td colSpan={6}>{s.guided.transfer.answers.map((a, i) => `Q${i + 1}: ${a ? DIRECTION_LABEL[a] : "—"}`).join(" · ")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {log.length > 0 && (
        <section className="panel">
          <h3>Mystery Wire claims</h3>
          <div className="table-wrap">
            <table className="nb">
              <thead>
                <tr><th scope="col">Case</th><th scope="col">Meter alone?</th><th scope="col">Inspected</th><th scope="col">Claim</th><th scope="col">Supporting observation</th><th scope="col">Own words</th><th scope="col">Result</th></tr>
              </thead>
              <tbody>
                {log.map((e, i) => (
                  <tr key={i}>
                    <td>{e.label}</td>
                    <td>{MYSTERY_LAB.answers.find((a) => a.id === e.first)?.text ?? "—"}</td>
                    <td>{e.inspected.map((k) => (k === "ruler" ? "ruler" : "end faces")).join(", ") || "—"}</td>
                    <td>{e.claim}</td>
                    <td>{e.observation}</td>
                    <td>{e.text ? `“${e.text}”` : "—"}</td>
                    <td>{e.correct ? "Supported" : <span className="tag">revise</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
