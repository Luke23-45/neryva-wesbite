/**
 * Bottom action bar derivation (BUILD_PLAN.md §F) — one pure function, ordered
 * rules, first match owns the bar. C01 ships rules 1–4 + the beyond-scaffold
 * fallback; rules 5–10 arrive at assembly (BUILD_PLAN.md §14). The single
 * action invariant holds in every state: the bar never renders empty and
 * never renders two competing CTAs.
 */
export interface BottomActionInput {
  mode: 'new' | 'build';
  /** New-mode Purpose form validity (trimmed name 2–128). */
  purposeValid: boolean;
  hasDraft: boolean;
  brainReady: boolean;
  /** Draft exists but its instructions are blank (C02 — publish refuses). */
  instructionsEmpty: boolean;
  /** Knowledge satellite verdict subtitle when graded attention (C05) — a hint, never a block. */
  knowledgeAttention: string | null;
  /** Selected satellite is skippable, untouched, and holds no config. */
  selectedSkippableUntouched: boolean;
  selectedSlot: string | null;
}

export type BottomPrimary =
  | { action: 'create' }
  | { action: 'select'; target: string }
  | { action: 'engine-room' };

export interface BottomAction {
  primaryLabel: string;
  primary: BottomPrimary;
  showSkip: boolean;
  skipTarget: string | null;
  whisper: string | null;
}

export function deriveBottomAction(input: BottomActionInput): BottomAction {
  const skip =
    input.mode === 'build' && input.selectedSkippableUntouched && input.selectedSlot !== null
      ? { showSkip: true, skipTarget: input.selectedSlot }
      : { showSkip: false, skipTarget: null };

  // Rule 1 — pre-create: the only action is creating.
  if (input.mode === 'new') {
    return {
      primaryLabel: 'Create agent',
      primary: { action: 'create' },
      whisper: null,
      ...skip,
    };
  }

  // Rule 2 — no draft: nothing exists to configure against yet.
  if (!input.hasDraft) {
    return {
      primaryLabel: 'Start configuring',
      primary: { action: 'select', target: 'brain' },
      whisper: 'No versions yet — the first save in the Engine Room starts a draft.',
      ...skip,
    };
  }

  // Rule 3 — purpose invalid (unreachable from server-valid rows; kept so the
  // order matches the plan and a future import path can't strand the bar).
  if (!input.purposeValid) {
    return {
      primaryLabel: 'Name your agent',
      primary: { action: 'select', target: 'purpose' },
      whisper: 'Names run 2–128 characters.',
      ...skip,
    };
  }

  // Rule 4 — brain not ready: shipping needs at least one usable model.
  if (!input.brainReady) {
    return {
      primaryLabel: 'Choose a model',
      primary: { action: 'select', target: 'brain' },
      whisper: 'Shipping needs at least one usable model.',
      ...skip,
    };
  }

  // Rule 4b (C02) — draft without instructions: publish refuses, so the bar
  // sends the maker to the composer before anything downstream matters.
  if (input.instructionsEmpty) {
    return {
      primaryLabel: 'Write instructions',
      primary: { action: 'select', target: 'purpose' },
      whisper: 'Publish refuses empty instructions — the composer is one click away.',
      ...skip,
    };
  }

  // Rule 4c (C05) — knowledge graded attention: the satellite's own verdict
  // subtitle routes the maker there. A hint, never a block — publish gates.
  if (input.knowledgeAttention) {
    return {
      primaryLabel: 'Review knowledge',
      primary: { action: 'select', target: 'knowledge' },
      whisper: input.knowledgeAttention,
      ...skip,
    };
  }

  // Beyond the C01 scaffold: guided steps light up as their passes land.
  // The Room edits everything today — the bar says so instead of going quiet.
  return {
    primaryLabel: 'Open in Engine Room',
    primary: { action: 'engine-room' },
    whisper: 'Scaffold checks pass — guided steps light up as their passes land.',
    ...skip,
  };
}
