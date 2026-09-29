import styled from 'styled-components';

/**
 * Eval results — redesigned.
 *
 * The shared verdict view: stale banner first, decision pills,
 * required and optional checks, failing cases, provenance.
 * Rows are eval-owned cards with sentence-case sections.
 */

export const EvalSection = styled.div`
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 20px 0 4px;
`;

export const EvalList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const EvalItem = styled.div`
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 12px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  line-height: 1.65;
`;

export const EvalMeta = styled.div`
  margin-top: 4px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;

export const StaleBanner = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
`;

export const StaleHeadline = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const StaleDetail = styled.div`
  margin-top: 6px;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ShadowBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.6;
  color: ${({ theme }) => theme.app.status.info.fg};
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px dashed ${({ theme }) => theme.app.status.info.border};
`;

export const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
`;

export const ScoreLine = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const FinishedAt = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
  font-variant-numeric: tabular-nums;
`;

export const Undecided = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
`;

export const CheckRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
  margin-top: 8px;
`;

export const CheckMark = styled.span<{ $pass: boolean }>`
  flex: none;
  font-weight: 700;
  color: ${({ theme, $pass }) => ($pass ? theme.app.status.success.fg : theme.app.status.error.fg)};
`;

export const CaseCard = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const CaseExcerpt = styled.div`
  color: ${({ theme }) => theme.app.text.secondary};
  font-style: italic;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const CopyRow = styled.div`
  margin-top: 10px;
`;

export const EvalActions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 16px;
  flex-wrap: wrap;
`;
