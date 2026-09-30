import { Link } from '@tanstack/react-router';
import styled from 'styled-components';

/**
 * v10 inspector chrome (LEDGER.md §4 I1): panel on theme.app.bg.raised,
 * 360px wide, flat colors only (C1). Cards on theme.app.surface.subtle
 * (the one-step elevation above the panel) with theme.app.border.default
 * hairlines; text on the app text ramp
 * (primary/secondary/muted/faint); primary accent on theme.app.text.link.
 */

export const Panel = styled.aside`
  width: 360px;
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* T15: the resize handle is absolutely positioned against the inner edge. */
  position: relative;
  background: ${({ theme }) => theme.app.bg.raised};
  border-left: 1px solid ${({ theme }) => theme.app.border.default};
  overflow-y: auto;
  /* Hidden scrollbar (Figma-style): scrolling still works via wheel /
     touch / keyboard, the bar itself is never painted. */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const InspectorHead = styled.div`
  padding: ${({ theme }) => theme.spacing.s4} ${({ theme }) => theme.spacing.s4} ${({ theme }) => theme.spacing.px14};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const HeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
`;

/** T15: ghost icon button that hides the inspector into the topbar.
 * `margin-left: auto` pins it to the right in both head variants (empty
 * state and node head, where it sits after the StatusChip). Flat colors. */
export const CollapseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.app.iconSize.md};
  height: ${({ theme }) => theme.app.iconSize.md};
  flex: none;
  margin-left: auto;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.text.link};
    outline-offset: 1px;
  }
`;

export const HeadIconTile = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: ${({ theme }) => theme.app.iconSize.lg};
  height: ${({ theme }) => theme.app.iconSize.lg};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $color }) => `color-mix(in srgb, ${$color} 14%, transparent)`};
  color: ${({ $color }) => $color};
`;

export const HeadText = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const HeadTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appTight};
`;

export const MetaLine = styled.span`
  margin-top: ${({ theme }) => theme.spacing.px2};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Head = styled.div`
  padding: ${({ theme }) => theme.spacing.s4} ${({ theme }) => theme.spacing.s4} ${({ theme }) => theme.spacing.s3};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Title = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const Subtitle = styled.div`
  margin-top: ${({ theme }) => theme.spacing.px2};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const Body = styled.div`
  padding: ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s4};
`;

export const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.faint};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const PassTag = styled.span`
  align-self: flex-start;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.wide};
  padding: ${({ theme }) => theme.spacing.px2} ${({ theme }) => theme.spacing.s2};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.muted};
`;

/** Section eyebrow: micro/600, letterspaced, muted (v10 caps treatment). */
export const CapsLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.wide};
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.s2};
`;

export const TypeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const TypeRow = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.text.link};
    outline-offset: 1px;
  }
`;

export const TypeDot = styled.span<{ $color: string }>`
  width: ${({ theme }) => theme.spacing.px10};
  height: ${({ theme }) => theme.spacing.px10};
  flex: none;
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ $color }) => $color};
`;

export const TypeMain = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const TypeLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

export const TypeBlurb = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const TypeNote = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const ModelRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const EmptySelect = styled.div`
  padding: ${({ theme }) => theme.spacing.s5} ${({ theme }) => theme.spacing.s4};
  text-align: center;
  color: ${({ theme }) => theme.app.text.muted};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const LockedWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.px14};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.faint};
`;

/* ── Purpose extras: linked blueprint (I5), next steps (I6), CTA (I7) ── */

export const ExtrasSection = styled.section`
  display: flex;
  flex-direction: column;
`;

export const BlueprintCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
  padding: ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

export const BlueprintTop = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const BlueprintIconTile = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: ${({ theme }) => theme.app.iconSize.lg};
  height: ${({ theme }) => theme.app.iconSize.lg};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.app.status.lilac.bg};
  color: ${({ theme }) => theme.app.status.lilac.fg};
`;

export const BlueprintMeta = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const BlueprintSlug = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BlueprintSub = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const GalleryLink = styled(Link)`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

/* ── Purpose extras: next steps (I6), CTA (I7) ──────────────────────────
 * Apple grouped-list treatment: a quiet sentence-case title, one continuous
 * card with hairline dividers (never boxed-every-row), generous 52px rows,
 * and a true primary CTA. No all-caps, no banner-looking button.
 */

/** Quiet section title — sentence case, never the caps treatment. */
export const NextStepsTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.secondary};
`;

/** iOS grouped list: one card, hairline dividers, radius clipped. */
export const NextStepsList = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  overflow: hidden;
`;

export const NextStepRow = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  width: 100%;
  min-height: 52px;
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.title};
  text-align: left;
  cursor: pointer;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
  }

  &:active {
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.text.link};
    outline-offset: -2px;
  }
`;

export const NextStepDot = styled.span<{ $color: string }>`
  width: ${({ theme }) => theme.spacing.s2};
  height: ${({ theme }) => theme.spacing.s2};
  flex: none;
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ $color }) => $color};
`;

export const NextStepLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
`;

export const NextStepChevron = styled.span`
  display: inline-flex;
  flex: none;
  color: ${({ theme }) => theme.app.text.muted};
`;

/** True primary CTA — system blue, white text, real button padding/radius. */
export const CtaButton = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.s4};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.app.accentControl};
  color: #ffffff;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: -0.01em;
  cursor: pointer;

  &:hover {
    background: #1890ff;
  }

  &:active {
    background: #0077e6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;
