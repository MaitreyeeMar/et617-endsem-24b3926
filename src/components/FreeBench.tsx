"use client";
import { findTrial, reference, type AppState } from "@/lib/state";
import { runTest, setDraft, type Updater } from "@/lib/actions";
import { describeTrial } from "@/lib/feedback";
import { Bench } from "./Bench";
import { ActionBar } from "./Guided";
import { CompareView } from "./Notebook";

export function FreeBench({ s, update }: { s: AppState; update: Updater }) {
  const pinned = findTrial(s, s.pinnedId) ?? reference(s);
  const lastTrial = findTrial(s, s.lastTrialId);
  const trials = s.trials.filter((t) => t.context !== "given");
  const [a, b] = s.compareIds.map((id) => findTrial(s, id));
  return (
    <div className="layout">
      <section className="panel task">
        <p className="eyebrow">Free Bench</p>
        <h2>Try anything. Lock a property to keep it fixed, pin a trial as your reference, and compare two runs.</h2>
        <p className="muted">Pinned reference: {describeTrial(pinned)}</p>
      </section>
      <Bench
        draft={s.draft}
        lastTested={s.lastTested}
        lastTrial={lastTrial}
        referenceTrial={pinned}
        referenceTitle={`Test A · Pinned reference (${pinned.label})`}
        onChange={(p, v) => update((d) => setDraft(d, p, v))}
        locked={s.locked}
        onToggleLock={(p) => update((d) => void (d.locked[p] = !d.locked[p]))}
      />
      <section className="panel">
        <h3>Your runs</h3>
        <p className="muted">Tick two runs to compare. Pin one to show it on Test A.</p>
        <ul className="runs">
          {trials.slice().reverse().map((t) => (
            <li key={t.id} className={s.compareIds.includes(t.id) ? "on" : ""}>
              <label>
                <input
                  type="checkbox"
                  checked={s.compareIds.includes(t.id)}
                  disabled={!s.compareIds.includes(t.id) && s.compareIds.length >= 2}
                  onChange={() => update((d) => void (d.compareIds = d.compareIds.includes(t.id) ? d.compareIds.filter((x) => x !== t.id) : [...d.compareIds, t.id]))}
                />
                {describeTrial(t)}
              </label>
              <button className="link" disabled={s.pinnedId === t.id} onClick={() => update((d) => void (d.pinnedId = t.id))}>
                {s.pinnedId === t.id ? "Pinned" : "Pin"}
              </button>
            </li>
          ))}
        </ul>
        {a && b && <CompareView a={a} b={b} />}
      </section>
      <ActionBar>
        <button className="btn btn-primary" onClick={() => update((d) => void runTest(d, "free"))}>Test wire</button>
      </ActionBar>
    </div>
  );
}
