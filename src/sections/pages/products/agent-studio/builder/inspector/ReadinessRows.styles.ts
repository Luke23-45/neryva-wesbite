import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

/**
 * Readiness rows — redesigned.
 *
 * Shared gate rows (C14 — ship and detail render these, never two
 * implementations). State reads as dot + word; fixes ride the row.
 */

export const Rows = styled.div`
  display: flex;
  flex-direction: column;
`;

export const CheckRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.strong};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const CheckIcon = styled.span<{ $tone: 'success' | 'warning' | 'error' | 'neutral' }>`
  color: ${({ $tone, theme }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : theme.app.text.secondary};
  display: inline-flex;
  margin-top: 4px;
`;

export const CheckBody = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
`;

export const CheckTitle = styled.div`
  font-weight: 650;
  margin-bottom: 2px;
`;

export const ExtraList = styled.ul`
  margin: 8px 0 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FixZone = styled.div`
  margin-top: 8px;
`;

export const FixJump = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

export const FixRouteLink = styled(Link)`
  font-size: ${({ theme }) => theme.app.type.caption};
`;
