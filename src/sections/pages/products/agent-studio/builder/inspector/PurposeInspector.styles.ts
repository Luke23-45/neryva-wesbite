import styled from 'styled-components';

/**
 * Identity section — redesigned.
 *
 * The read state is a profile card, not a definition list: identity is a
 * face, and faces get presence. The form states give the name field visual
 * primacy (it IS the identity) and guide with helper microcopy instead of
 * bare counters.
 */

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

export const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FieldHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 12px;
`;

export const Counter = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
  flex: none;
`;

export const Helper = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

/* ── Read state: the identity card ─────────────────────────────── */

export const IdentityCard = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const IdentityMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const IdentityName = styled.div`
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: anywhere;
`;

export const IdentityDesc = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
  overflow-wrap: anywhere;
`;

export const IdentityEmpty = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.faint};
  font-style: italic;
`;

export const CardActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex: none;
`;

export const MetaRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
`;

export const MetaButton = styled.button`
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.muted};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.subtle};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.status.info.fg};
    outline-offset: 2px;
  }
`;

export const MetaDot = styled.span`
  color: ${({ theme }) => theme.app.text.faint};
  font-size: ${({ theme }) => theme.app.type.caption};
  user-select: none;
`;

/* ── Form state ────────────────────────────────────────────────── */

export const TakenPanel = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const TakenTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const TakenBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

export const RowActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

export const DeniedPanel = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 14px;
  padding: 20px 22px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
  max-width: 560px;
`;

export const GalleryLink = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;
  padding-top: 4px;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};

  a {
    color: ${({ theme }) => theme.app.status.info.fg};
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;
