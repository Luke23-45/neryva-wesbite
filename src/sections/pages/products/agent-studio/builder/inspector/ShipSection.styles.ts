import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

/**
 * Ship section — redesigned.
 *
 * The publish ceremony: the verdict, readiness rows, the degraded
 * acknowledge, the confirm-gated publish, refusals with their fixes,
 * and the success receipt. Copy stays engine-verbatim; layout reads
 * at a real measure.
 */

export { Muted } from './TrySection.styles';

export const Verdict = styled.div<{ $tone: 'success' | 'warning' | 'error' | 'neutral' }>`
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 650;
  letter-spacing: -0.005em;
  margin-bottom: 6px;
  color: ${({ $tone, theme }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : theme.app.text.primary};
`;

export const Dot = styled.span<{ $tone: 'success' | 'warning' | 'error' | 'neutral' }>`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  align-self: center;
  background: ${({ $tone, theme }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : theme.app.text.muted};
`;

export const Sub = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.65;
  margin-bottom: 10px;
`;

export const FixLink = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

export const RefusalLink = styled(Link)`
  font-size: ${({ theme }) => theme.app.type.caption};
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const Refusal = styled.div`
  margin-top: 16px;
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  background: ${({ theme }) => theme.app.status.error.bg};
  border-radius: 14px;
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
`;

export const RefusalTitle = styled.strong`
  font-weight: 650;
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const RefusalMessage = styled.div`
  margin-top: 6px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const RefusalFix = styled.div`
  margin-top: 10px;
`;

export const Notice = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  margin-top: 10px;
  line-height: 1.65;
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const AckLabel = styled.label`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.primary};
  margin-top: 12px;
`;

export const AckCheckbox = styled.input`
  margin-top: 4px;
  width: 18px;
  height: 18px;
  flex: none;
  accent-color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const PublishBlock = styled.div`
  margin-top: 16px;
`;
