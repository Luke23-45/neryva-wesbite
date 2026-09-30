import styled from 'styled-components';
import { SPEC_BLUE, SPEC_LINK } from './BlockCard.styles';

/** Rules builder styles — the repeatable-block card for Instructions. */

export const RulesCard = styled.div`
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const RulesHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const RulesTitle = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
  color: ${({ theme }) => theme.app.text.primary};
  flex: 1;
`;

export const CountPill = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.secondary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
`;

export const RulesHelper = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const DashedArea = styled.div`
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  padding: 22px 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
`;

export const DashedTitle = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const DashedHint = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
  max-width: 380px;
  line-height: 1.55;
`;

export const DashedActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  margin-top: 6px;
`;

export const AddButton = styled.button`
  border: 0;
  border-radius: 6px;
  background: ${SPEC_BLUE};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  padding: 7px 16px;
  cursor: pointer;
  transition: filter ${({ theme }) => theme.transitions.fast};

  &:hover {
    filter: brightness(1.12);
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }
`;

export const BrowseLink = styled.button`
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  color: ${SPEC_LINK};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
    border-radius: 4px;
  }
`;

export const RuleList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const RuleRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  padding: 8px 8px 8px 12px;
`;

export const RuleText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.body};
`;

export const RuleEmpty = styled(RuleText)`
  color: ${({ theme }) => theme.app.text.ghost};
  font-style: italic;
`;

export const ModeTag = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.muted};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
  flex: 0 0 auto;
`;

export const RowButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;
  flex: 0 0 auto;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
    background: transparent;
    color: ${({ theme }) => theme.app.text.muted};
  }
`;

export const RulesFooter = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  padding-top: 4px;
`;
