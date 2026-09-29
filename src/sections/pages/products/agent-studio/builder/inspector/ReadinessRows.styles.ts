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
  gap: ${({ theme }) => theme.spacing.s3};
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.s3} 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.strong};

  &:focus-visible {
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
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
  margin-top: ${({ theme }) => theme.spacing.s1};
`;

export const CheckBody = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const CheckTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.px2};
`;

export const ExtraList = styled.ul`
  margin: ${({ theme }) => theme.spacing.s2} 0 0;
  padding-left: ${({ theme }) => theme.spacing.px20};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
`;

export const FixZone = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s2};
`;

export const FixJump = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: ${({ theme }) => theme.spacing.px2};
`;

export const FixRouteLink = styled(Link)`
  font-size: ${({ theme }) => theme.app.type.caption};
`;
