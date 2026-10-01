import styled from 'styled-components';
import { ActionButton } from '@components/common/ui/ActionButton';

/**
 * Credentials panel — redesigned.
 *
 * A credential fingerprint list where each row reads as a managed secret:
 * elevated rows, real flag presence, and rotate/revoke forms that feel
 * like deliberate ceremony rather than nested widgets.
 */

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px14};
`;

export const CredRow = styled.div<{ $revoked?: boolean }>`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  opacity: ${({ $revoked }) => ($revoked ? 0.85 : 1)};
`;

export const CredHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const CredName = styled.span`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CredMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const CredFlag = styled.span<{ $tone: 'red' | 'amber' | 'muted' | 'info' }>`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  padding: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.px10};
  border-radius: ${({ theme }) => theme.radii.pill};
  white-space: nowrap;
  color: ${({ theme, $tone }) =>
    $tone === 'red'
      ? theme.app.status.error.fg
      : $tone === 'amber'
        ? theme.app.status.warning.fg
        : $tone === 'info'
          ? theme.app.status.info.fg
          : theme.app.text.muted};
  background: ${({ theme, $tone }) =>
    $tone === 'red'
      ? theme.app.status.error.bg
      : $tone === 'amber'
        ? theme.app.status.warning.bg
        : $tone === 'info'
          ? theme.app.status.info.bg
          : theme.app.surface.active};
`;

export const RowActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s4};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.s1};
`;

export const TextButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-family: inherit;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s2};
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const DangerButton = styled(TextButton)`
  color: ${({ theme }) => theme.app.status.error.fg};
`;

export const InlineForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.bg.base};
  margin-top: ${({ theme }) => theme.spacing.s1};
`;

export const FormNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const CheckRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.px10};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  cursor: pointer;

  input {
    margin-top: ${({ theme }) => theme.spacing.s1};
    width: ${({ theme }) => theme.app.iconSize.sm};
    height: ${({ theme }) => theme.app.iconSize.sm};
    accent-color: ${({ theme }) => theme.app.status.error.fg};
  }
`;

export const DeniedNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Counter = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
  text-align: right;
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const Select = styled.select`
  height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.app.border.focus};
  }
`;

export const SelectWrap = styled.label`
  font-size: ${({ theme }) => theme.app.type.caption};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
`;

/* D-BUG2: local 44px-tall hit area for the small credentials buttons —
   visual-neutral (the visible button keeps its sm size). Kept local:
   ActionButton sm is shared with platform pages, so the global stays. */
export const SmButton = styled(ActionButton)`
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -8px 0;
  }
`;
