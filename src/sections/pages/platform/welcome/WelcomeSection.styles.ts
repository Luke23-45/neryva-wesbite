/**
 * `/platform/welcome` — first-run workspace setup (first-run ledger F1-7).
 *
 * An iOS-idiom grouped sheet: one centered narrow column on a cool-gray
 * canvas, white inset cards with hairline dividers, small section headers,
 * tinted glyph tiles, a real switch for consent, and a bottom-pinned action
 * dock. Nothing is shared with the sign-in surface except the brand gradient
 * on the avatar — the two screens can never read as the same page.
 *
 * Every value resolves through the design tokens (`src/styles/theme/*`).
 * `INK_ON_EMERALD` is the ink the shell already pairs with the emerald CTA.
 */
import styled from 'styled-components';
import { transitions } from '@styles/theme/transitions';

/** Ink that stays legible on the emerald CTA (same pairing the shell uses). */
const INK_ON_EMERALD = '#05231b';

/** iOS grouped-table canvas: cool gray, one centered narrow sheet. */
export const Stage = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background.tertiary};
  padding: 64px 16px 48px;

  ${({ theme }) => theme.media.mobile} {
    padding: 40px 16px;
  }
`;

export const Sheet = styled.div`
  width: 100%;
  max-width: 400px;
`;

/** Cold-load state shares the canvas so nothing flashes on a cold load. */
export const Boot = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: ${({ theme }) => theme.colors.background.tertiary};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.muted};

  span {
    animation: welcome-pulse 1.6s ease-in-out infinite;
  }
  @keyframes welcome-pulse {
    0%,
    100% {
      opacity: 0.45;
    }
    50% {
      opacity: 1;
    }
  }
  ${({ theme }) => theme.media.reducedMotion} {
    span {
      animation: none;
    }
  }
`;

export const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 30px;
`;

export const Avatar = styled.span`
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radii['3xl']};
  background: ${({ theme }) => theme.colors.gradients.primary};
  color: #ffffff;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.01em;
  box-shadow: ${({ theme }) => theme.shadows.md};
  user-select: none;
`;

export const HeroTitle = styled.h1`
  margin: 20px 0 8px;
  font-size: clamp(26px, 6vw, 32px);
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

export const HeroSub = styled.p`
  margin: 0;
  max-width: 34ch;
  font-size: 15px;
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// ── Identity card (inset, single-row group) ─────────────────────────────────
//
// iOS grouped-table grammar for "who is this": a glyph tile, a two-line
// label/value pair, and a trailing state. Here the state is a static verified
// chip — the account under setup is, by construction, the signed-in one.

export const IdCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  margin-bottom: 24px;
`;

export const IdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-height: 64px;
`;

export const IdGlyph = styled.span`
  width: 32px;
  height: 32px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.gradients.primary};
  color: #ffffff;

  svg {
    width: 17px;
    height: 17px;
  }
`;

export const IdBody = styled.span`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
`;

export const IdLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const IdValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const IdCheck = styled.span`
  width: 22px;
  height: 22px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ theme }) => theme.colors.accent.emerald};
  color: ${INK_ON_EMERALD};

  svg {
    width: 12px;
    height: 12px;
  }
`;

// ── Inset grouped cards (the iOS "Settings" primitive) ───────────────────────

/** Stacks the grouped cards; rows/cards draw their own separators. */
export const Form = styled.form`
  display: block;
  width: 100%;
`;

export const Block = styled.div`
  margin-bottom: 24px;
`;

export const SectionLabel = styled.span`
  display: block;
  margin: 0 0 8px 16px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

/** One tappable-height row; rows after the first draw the inset hairline. */
export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  min-height: 60px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
`;

/** Tinted glyph tile — the brand gradient set, chosen per row by tone. */
export const Tile = styled.span<{ $tone: 'warm' | 'primary' }>`
  width: 32px;
  height: 32px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #ffffff;
  background: ${({ $tone, theme }) => theme.colors.gradients[$tone]};

  svg {
    width: 17px;
    height: 17px;
  }
`;

export const RowBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
`;

export const RowLabel = styled.label`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.muted};
  cursor: text;
`;

export const RowInput = styled.input`
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  outline: none;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16.5px;
  color: ${({ theme }) => theme.colors.text.primary};
  caret-color: ${({ theme }) => theme.colors.accent.azure};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

/** Footer line under a card — helper copy or a validation verdict. */
export const CardNote = styled.p<{ $error?: boolean }>`
  margin: 8px 16px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  line-height: 1.45;
  color: ${({ $error, theme }) => ($error ? theme.colors.semantic.errorText : theme.colors.text.muted)};

  svg {
    width: 13px;
    height: 13px;
    flex: none;
  }
`;

// ── Consent switch card ──────────────────────────────────────────────────────

export const TermsPanel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

export const TermsLinks = styled.div`
  padding: 15px 16px 4px;
  font-size: 13.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};

  a {
    color: ${({ theme }) => theme.colors.accent.azureText};
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color ${transitions.fast};

    &:hover {
      color: ${({ theme }) => theme.colors.text.primary};
    }
    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.accent.azure};
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
`;

export const TermsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-height: 64px;
`;

export const TermsText = styled.label`
  flex: 1;
  min-width: 0;
  font-size: 14.5px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
`;

export const TermsSub = styled.span`
  display: block;
  margin-top: 2px;
  font-size: 12.5px;
  color: ${({ theme }) => theme.colors.text.muted};
`;

/** iOS switch — 51×31 footprint, emerald when on, knob slides. */
export const ConsentSwitch = styled.input`
  appearance: none;
  width: 51px;
  height: 31px;
  flex: none;
  margin: 0;
  padding: 2px;
  display: block;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.text.muted};
  transition: background ${transitions.fast};

  &::before {
    content: '';
    display: block;
    width: 27px;
    height: 27px;
    border-radius: ${({ theme }) => theme.radii.round};
    background: #ffffff;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
    transition: transform ${transitions.fast};
  }
  &:checked {
    background: ${({ theme }) => theme.colors.accent.emerald};
  }
  &:checked::before {
    transform: translateX(20px);
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.azure};
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;

// ── Bottom dock ──────────────────────────────────────────────────────────────

export const Dock = styled.div`
  position: sticky;
  bottom: 12px;
  margin: 32px -8px -8px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii['3xl']};
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px) saturate(1.6);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const ContinueButton = styled.button`
  width: 100%;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.text.primary};
  color: #ffffff;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.005em;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: transform ${transitions.fast}, box-shadow ${transitions.fast}, opacity ${transitions.fast};

  svg {
    width: 17px;
    height: 17px;
    transition: transform ${transitions.fast};
  }
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    svg {
      transform: translateX(2px);
    }
  }
  &:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.shadows.focus};
  }
`;

export const SkipButton = styled.button`
  width: 100%;
  margin-top: 4px;
  background: none;
  border: 0;
  padding: 12px 10px 4px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.muted};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.azure};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

export const Micro = styled.p`
  margin: 20px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: center;

  svg {
    width: 13px;
    height: 13px;
    flex: none;
  }
`;