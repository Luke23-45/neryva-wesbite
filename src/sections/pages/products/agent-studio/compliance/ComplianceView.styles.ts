import styled from 'styled-components';

export const FrameworkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const FrameworkCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

export const FrameworkTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const FrameworkName = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: ${({ theme }) => theme.app.text.muted};
  }
`;

export const FrameworkRenewal = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const FrameworkControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ControlsLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ControlsValue = styled.span`
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

export const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ControlName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ControlCategory = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const ResidencyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ResidencyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const ResidencyLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const ResidencyRegion = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ResidencyData = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const ResidencyNote = styled.div`
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.status.success.bg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

export const ResidencyNoteIcon = styled.span`
  color: ${({ theme }) => theme.app.status.success.fg};
  flex-shrink: 0;
  margin-top: 1px;
  display: inline-flex;
`;

export const ResidencyNoteText = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const AuditTime = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  width: 88px;
  flex-shrink: 0;
`;

export const AuditCategory = styled.span<{ $kind: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  background: ${({ $kind, theme }) =>
    $kind === 'security'
      ? theme.app.status.info.bg
      : $kind === 'export'
        ? theme.app.status.amethyst.bg
        : $kind === 'privacy'
          ? theme.app.status.warning.bg
          : $kind === 'storage'
            ? theme.app.status.neutral.bg
            : theme.app.status.success.bg};
  color: ${({ $kind, theme }) =>
    $kind === 'security'
      ? theme.app.status.info.fg
      : $kind === 'export'
        ? theme.app.status.amethyst.fg
        : $kind === 'privacy'
          ? theme.app.status.warning.fg
          : $kind === 'storage'
            ? theme.app.status.neutral.fg
            : theme.app.status.success.fg};
  font-weight: 500;
  flex-shrink: 0;
`;

export const AuditEvent = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  min-width: 0;
`;

export const AuditActor = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

/** Quiet mono meta hint used in panel header actions. */
export const MetaHint = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;
