import styled from 'styled-components';

/**
 * ModelPicker — redesigned.
 *
 * The catalog is a choice surface, not a settings list: roomier rows,
 * sentence-case group headers, and icon buttons instead of text glyphs.
 */

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px14};
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 ${({ theme }) => theme.spacing.px14} 0 38px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='%238E8E93' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M20 20l-3.5-3.5'/%3E%3C/svg%3E") no-repeat 13px center;
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.body};
  font-family: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.app.border.focus};
  }
`;

export const OrderStrip = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const OrderLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const GroupLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.muted};
  margin: ${({ theme }) => theme.spacing.px6} 0 ${({ theme }) => theme.spacing.px2};
`;

export const OrderChip = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const OrderName = styled.span`
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const OrderIndex = styled.span`
  flex: none;
  width: ${({ theme }) => theme.app.iconSize.md};
  height: ${({ theme }) => theme.app.iconSize.md};
  border-radius: ${({ theme }) => theme.radii.round};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  color: ${({ theme }) => theme.app.text.muted};
  background: ${({ theme }) => theme.app.surface.hover};
`;

export const MiniButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.app.iconSize.md};
  height: ${({ theme }) => theme.app.iconSize.md};
  flex: none;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const CatalogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  max-height: 380px;
  overflow-y: auto;
  padding-right: ${({ theme }) => theme.spacing.px2};
`;

export const CatalogRow = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s3};
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.7 : 1)};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  input {
    margin-top: ${({ theme }) => theme.spacing.s1};
    width: ${({ theme }) => theme.app.iconSize.sm};
    height: ${({ theme }) => theme.app.iconSize.sm};
    flex: none;
    accent-color: ${({ theme }) => theme.app.accentControl};
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  }
`;

export const RowMain = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
  flex: 1;
  min-width: 0;
`;

export const RowName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const RowMeta = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  overflow-wrap: anywhere;
`;

export const ReasonText = styled.span<{ $tone: 'amber' | 'red' | 'muted' }>`
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme, $tone }) =>
    $tone === 'amber' ? theme.app.status.warning.fg : $tone === 'red' ? theme.app.status.error.fg : theme.app.text.muted};
`;

export const FixButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  font-family: inherit;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.px2} 0;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const CapNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const EmptyNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.xl};
`;
