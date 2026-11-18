"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_NAME, ROLL_NO } from "@/config/identity";
import { UI } from "@/config/content";
import { clearState, initialState, loadState, saveState, type AppState, type View } from "@/lib/state";
import type { Updater } from "@/lib/actions";
import { Guided } from "./Guided";
import { FreeBench } from "./FreeBench";
import { Notebook } from "./Notebook";
import { About } from "./About";
import { ThemeToggle } from "./ThemeToggle";

const TABS: { id: View; label: string }[] = [
  { id: "guided", label: "Guided" },
  { id: "free", label: "Free Bench" },
  { id: "notebook", label: "Notebook" },
  { id: "about", label: "About" },
];

export function Footer() {
  return (
    <footer className="footer">
      WireLab · ET617 · Roll no. <strong>{ROLL_NO}</strong>
    </footer>
  );
}

export default function WireLabApp() {
  const [s, setS] = useState<AppState | null>(null);
  const [left, setLeft] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const stateRef = useRef<AppState | null>(null);

  // Restore on first load.
  useEffect(() => {
    setS(loadState() ?? initialState());
  }, []);

  // Persist after every meaningful change.
  useEffect(() => {
    stateRef.current = s;
    if (s && saveState(s)) setSavedAt(Date.now());
  }, [s]);

  // Track active (visible) time for the observed-duration evidence.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && !left)
        setS((prev) => (prev ? { ...prev, activeMs: prev.activeMs + 5000 } : prev));
    }, 5000);
    return () => clearInterval(id);
  }, [left]);

  const update: Updater = useCallback((fn) => {
    setS((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  if (!s) return <div className="loading">Loading your bench…</div>;

  if (left) {
    const g = s.guided;
    const where = !g.started ? "the start" : g.index < 5 ? `Task ${g.index + 1} of 5` : g.index === 5 ? "the transfer questions" : "the summary";
    return (
      <div className="app">
        <div className="leave-top"><ThemeToggle /></div>
        <main className="leave">
          <h1>{UI.savedTitle}</h1>
          <p>{UI.savedBody}</p>
          <p>You will return to <strong>{where}</strong>, with your notebook and test wire as you left them.</p>
          <button className="btn btn-primary" onClick={() => setLeft(false)}>Continue now</button>
        </main>
        <Footer />
      </div>
    );
  }

  const newAttempt = () => {
    if (!window.confirm(UI.newAttemptConfirm)) return;
    clearState();
    setS(initialState());
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">⌁</span>
          <span>
            <strong>WireLab</strong>
            <span className="brand-sub">The Mystery Wire</span>
          </span>
        </div>
        <nav className="tabs" aria-label="Modes">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${s.view === t.id ? "on" : ""}`}
              aria-current={s.view === t.id ? "page" : undefined}
              onClick={() => update((d) => void (d.view = t.id))}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <ThemeToggle />
          <button className="btn btn-ghost" onClick={() => { if (stateRef.current) saveState(stateRef.current); setLeft(true); }}>
            {UI.saveLeave}
          </button>
        </div>
      </header>
      <main className="main" aria-label={APP_NAME}>
        {s.view === "guided" && <Guided s={s} update={update} />}
        {s.view === "free" && <FreeBench s={s} update={update} />}
        {s.view === "notebook" && <Notebook s={s} update={update} />}
        {s.view === "about" && <About onNewAttempt={newAttempt} />}
      </main>
      <div className="savebar">
        <span className="muted">{savedAt ? "Progress saved on this device" : "Saving unavailable — progress will not persist"}</span>
        <button className="link" onClick={newAttempt}>{UI.newAttempt}</button>
      </div>
      <Footer />
    </div>
  );
}
