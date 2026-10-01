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
  gap: ${({ theme }) => theme.spacing.s6};
`;

export const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const FieldHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const Counter = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  flex: none;
`;

export const Helper = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

/* ── Read state: the identity card ─────────────────────────────── */

export const IdentityCard = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px20};
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.s5};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const Avatar = styled.div`
  width: ${({ theme }) => theme.app.iconSize.avatar};
  height: ${({ theme }) => theme.app.iconSize.avatar};
  border-radius: ${({ theme }) => theme.radii['2xl']};
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.app.type.pageTitle};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const IdentityMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px6};
`;

export const IdentityName = styled.div`
  font-size: ${({ theme }) => theme.app.type.titleLg};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: anywhere;
`;

export const IdentityDesc = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
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
  gap: ${({ theme }) => theme.spacing.s2};
  align-items: center;
  flex: none;
`;

export const MetaRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s1};
  align-items: center;
  flex-wrap: wrap;
`;

export const MetaButton = styled.button`
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.px6} ${({ theme }) => theme.spacing.s2};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.muted};
  /* The meta actions are SUPPOSED to look small (12px caption + 6px padding
     ≈ 29px tall). The 44px hit box is an invisible ::after expansion —
     visuals unchanged. inset -10px top/bottom -> ~49px hit box. */
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -10px 0;
  }

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.subtle};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
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
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const TakenTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export const TakenBody = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const RowActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.px10};
  flex-wrap: wrap;
  align-items: center;
`;

export const DeniedPanel = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.s5};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  max-width: ${({ theme }) => theme.containers.narrow};
`;

export const GalleryLink = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  padding-top: ${({ theme }) => theme.spacing.s1};
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};

  a {
    color: ${({ theme }) => theme.app.status.info.fg};
    text-decoration: none;
    font-weight: ${({ theme }) => theme.typography.weights.medium};

    &:hover {
      text-decoration: underline;
    }
  }
`;
