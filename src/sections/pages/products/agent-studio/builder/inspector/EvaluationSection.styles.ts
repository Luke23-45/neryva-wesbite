import { createLink } from '@tanstack/react-router';
import styled from 'styled-components';

/**
 * Evaluation section — redesigned.
 *
 * The builder's evaluator satellite: what it runs against, which
 * dataset, the run controls, the latest decision, and what it is
 * watching. Each concern reads as a titled block.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle, Wrap } from './InstructionsSection.styles';
export { Muted } from './TrySection.styles';

export const DatasetLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const AttemptsWrap = styled.div`
  max-width: 220px;
`;

export const ActionsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px10};
  align-items: center;
  flex-wrap: wrap;
`;

export const LinkRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
  align-items: center;
`;

/**
 * DS-21: 44px hit area for flow-critical navigation links (Wave B
 * HitTextButton/InlineRetry precedent) — the text keeps its inline-link
 * treatment, vertically centered in the taller target. Built with
 * createLink rather than styled(Link): the styled() wrapper erases the
 * route's search-param inference.
 */
const HitNavAnchor = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
`;
export const HitNavLink = createLink(HitNavAnchor);

export const FixBlock = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border-radius: ${({ theme }) => theme.radii.xl};
`;

export const FixTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.px6};
`;

export const FixForm = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px10};
  align-items: flex-end;
  margin-top: ${({ theme }) => theme.spacing.px10};
  flex-wrap: wrap;
`;

export const FixField = styled.div`
  min-width: 200px;
  flex: 1;
`;

export const FixLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s4};
  margin-top: ${({ theme }) => theme.spacing.px10};
  flex-wrap: wrap;
`;

/**
 * Inline query-error panel for the runs list (P1a): names the failure,
 * states the consequence (nothing lost), and offers the retry. Error
 * tone only — never the denied treatment.
 */
export const RunsError = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  background: ${({ theme }) => theme.app.status.error.bg};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const RunsErrorTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const RunsErrorBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/** Inline text retry button — link treatment, no chrome. */
export { InlineRetry } from './InlineRetry';
