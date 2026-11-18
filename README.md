# WireLab: The Mystery Wire — ET617 · Roll no. 24B3926

Live: https://et617-24b3926.vercel.app

Inquiry-based virtual lab (P5-T4): resistance of a wire vs length, area and material, for a Class 10 learner repeating the topic (L5), one sequence in ≤ 10 min with exact resume (C4).

## Run
```bash
npm install
npm run verify   # checks the 3 numerical reference cases
npm run dev      # http://localhost:3000
npm run build && npm start
```
Optional AI: copy `.env.example` → `.env.local` and set `ANTHROPIC_API_KEY`. Without it the app uses built-in feedback.

## File map (edit these during the viva)
| File | What it holds |
|---|---|
| `src/config/physics.ts` | **Physics constants**: V = 0.10 V, ρ values, allowed L/A settings, reference wire, match tolerance, assumptions |
| `src/config/content.ts` | **All activity wording + feedback rules**: challenge, task questions, reason chips, branch messages, compare questions, mystery prompts, worked answer, transfer items, AI category → follow-up map |
| `src/config/identity.ts` | Roll number + app name (footer and About) |
| `src/lib/physics.ts` | The one simulation engine: `R = ρL/A`, `I = V/R`, unrounded match check, changed-property detection |
| `src/lib/state.ts` | App state shape, localStorage save/load (`wirelab-24B3926-v1`) |
| `src/lib/actions.ts` | Draft edits and `runTest` (Test wire → logged trial) |
| `src/lib/feedback.ts` | Built-in reason classifier, prediction branching, trial-specific fallback prompts, client call to AI with fallback |
| `src/app/api/classify/route.ts` | Server AI endpoint: prompt, schema, validation and cross-checks |
| `src/components/Bench.tsx` | Two rigs (ruler, end view with r ∝ √A, meter), controls, "Ready to test" logic |
| `src/components/Guided.tsx` | Five guided tasks + transfer + summary |
| `src/components/FreeBench.tsx` | Lock / pin / compare |
| `src/components/Notebook.tsx` | Trial table, evidence selection, original vs revised explanations |
| `src/components/WireLabApp.tsx` | Shell, tabs, autosave, Save & leave, New attempt, footer |
| `scripts/verify-physics.ts` | Reference-case checks |

## AI feature (D6)
- **Call:** `POST /api/classify` → `client.messages.create` (Anthropic TypeScript SDK) with model `claude-opus-5-5` (override `WIRELAB_AI_MODEL`), `output_config.effort: "low"`, JSON-schema structured output, 9 s timeout, 0 retries. Key read only from server env `ANTHROPIC_API_KEY`.
- **Prompt:** `SYSTEM_PROMPT` in `route.ts`. Learner text is wrapped in `<student_explanation>` and declared as data, not instructions.
- **Input:** `{ task, explanation, trials:[{label, material, length, area}] }`. The server checks the task is a known one, the settings are allowed values and the explanation is at most 800 characters, then recomputes the currents itself.
- **Output schema:** `{ category ∈ {supported_reasoning, length_misconception, area_misconception, confounded_comparison, unclear}, trial_changed_properties[], student_claimed_changes[], rationale }`.
- **Checks:**
  1. The category must be one of the allowed ones.
  2. The model's `trial_changed_properties` must equal the real changed set.
  3. `supported_reasoning` is rejected on a confounded pair (except the mystery task).
  4. `confounded_comparison` is rejected when only one property changed.
- **Mapping:** the category goes to the authored follow-up in `FOLLOW_UPS` (content.ts). The model's own text is never shown.
- **Fallback:** a missing key, timeout, API error, refusal, invalid JSON, invalid category or inconsistency returns `{ok:false, reason}`. The UI shows **"Using built-in feedback"** and a trial-specific prompt from `builtInFollowUp`.
- **Physics and success are always local.**

Example input:
```json
{"task":"length","explanation":"When only the length doubled, the current halved because the longer path has more resistance.",
 "trials":[{"label":"REF","material":"nichrome","length":1,"area":0.5},{"label":"#1","material":"nichrome","length":2,"area":0.5}]}
```
Expected model output (designed; not yet observed live):
```json
{"category":"supported_reasoning","trial_changed_properties":["length"],"student_claimed_changes":["length"],"rationale":"Links longer length to more resistance and lower current."}
```
Observed live response (no key configured): `{"ok":false,"reason":"missing_key"}`. The UI then showed "Using built-in feedback" and a follow-up mentioning the actual trial readings.
