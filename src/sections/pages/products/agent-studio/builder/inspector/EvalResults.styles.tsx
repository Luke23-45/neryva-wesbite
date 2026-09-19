import styled from 'styled-components';

/** C10-only eval primitives — labels/whispers/previews reuse shared sheets. */

export const StaleBanner = styled.div`
  margin: 8px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
`;

export const StaleHeadline = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const StaleDetail = styled.div`
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ShadowBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 11px;
  font-size: 11px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.status.info.fg};
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px dashed ${({ theme }) => theme.app.status.info.border};
`;

export const CheckRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
  line-height: 1.6;
  margin-top: 4px;
`;

export const CheckMark = styled.span<{ $pass: boolean }>`
  flex: none;
  font-weight: 700;
  color: ${({ theme, $pass }) => ($pass ? theme.app.status.success.fg : theme.app.status.error.fg)};
`;

export const CaseCard = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: 12px;
  line-height: 1.6;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;
