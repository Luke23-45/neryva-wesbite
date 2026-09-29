import styled from 'styled-components';

/**
 * Form primitives shared by the Compliance new-sections (holds, purges).
 * Carried over verbatim from the dialog-era ComplianceView styles — the
 * selects and validation lines keep the exact look the modals had.
 */
export const ScopeSelect = styled.select`
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.30);
  color: inherit;
  font-family: inherit;
  cursor: pointer;
`;

export const ValidationError = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.status.error.fg};
  padding: 4px 8px;
  border-radius: 6px;
  background: ${({ theme }) => theme.app.status.error.bg};
`;

export const FieldColumn = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
`;

export const Copy = styled.p`
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
  line-height: 1.5;
`;

export const CapsCopy = styled.p`
  margin: 0;
  font-size: 12px;
  opacity: 0.55;
  line-height: 1.5;
`;

export const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;
