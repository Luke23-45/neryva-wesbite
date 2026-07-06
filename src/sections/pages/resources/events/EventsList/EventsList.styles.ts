import styled from 'styled-components';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const SectionHeader = styled.div`
  margin-bottom: 80px;
`;

export const Label = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;
`;

export const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const EventGroup = styled.div`
  margin-bottom: 80px;
`;

export const GroupName = styled.h3`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 32px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.text.primary};
  display: inline-block;
`;

export const EventListContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const EventRow = styled.div`
  display: grid;
  grid-template-columns: 120px 2fr 1fr 1fr;
  align-items: start;
  padding: 32px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background 200ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 32px 24px;
  }
`;

export const EventDate = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: 0.05em;
  padding-top: 4px;
`;

export const EventDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 32px;

  ${({ theme }) => theme.media.tablet} {
    padding-right: 0;
  }
`;

export const EventTitle = styled.h4`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

export const EventDesc = styled.p`
  font-size: 1.0625rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const EventMetaGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
`;

export const EventMetaLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const EventMetaValue = styled.span`
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 500;
`;

export const ActionColumn = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;

  ${({ theme }) => theme.media.tablet} {
    justify-content: flex-start;
    margin-top: 16px;
  }
`;

export const RegisterButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 6px;
  text-decoration: none;
  transition: all 200ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.text.primary};
    color: ${({ theme }) => theme.colors.background.primary};
    border-color: ${({ theme }) => theme.colors.text.primary};
  }
`;
