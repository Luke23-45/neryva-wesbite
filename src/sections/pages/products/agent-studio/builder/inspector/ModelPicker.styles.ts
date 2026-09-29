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
  gap: 14px;
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 14px 0 38px;
  border-radius: 12px;
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
  gap: 8px;
`;

export const OrderLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const GroupLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.muted};
  margin: 6px 0 2px;
`;

export const OrderChip = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.muted};
  background: ${({ theme }) => theme.app.surface.hover};
`;

export const MiniButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  border: 0;
  border-radius: 8px;
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
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 2px;
`;

export const CatalogRow = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 13px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.7 : 1)};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  input {
    margin-top: 3px;
    width: 16px;
    height: 16px;
    flex: none;
    accent-color: #0a84ff;
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  }
`;

export const RowMain = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

export const RowName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const RowMeta = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

export const ReasonText = styled.span<{ $tone: 'amber' | 'red' | 'muted' }>`
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.55;
  color: ${({ theme, $tone }) =>
    $tone === 'amber' ? theme.app.status.warning.fg : $tone === 'red' ? theme.app.status.error.fg : theme.app.text.muted};
`;

export const FixButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: 2px 0;
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
  line-height: 1.6;
  padding: 16px 18px;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 13px;
`;
