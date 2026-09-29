import styled from 'styled-components';

/**
 * Publish success receipt — redesigned.
 *
 * Shared by the ship section and the detail panel. The receipt is a
 * calm success surface: the headline, the provenance lines, exits,
 * and the audit promise.
 */

export const Receipt = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  background: ${({ theme }) => theme.app.status.success.bg};
  border-radius: 16px;
  padding: 18px;
  margin-top: 16px;
`;

export const Headline = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 650;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.status.success.fg};
`;

export const Lines = styled.div`
  margin-top: 10px;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.7;
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
`;

export const Exits = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
`;

export const Footer = styled.div`
  margin-top: 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;
