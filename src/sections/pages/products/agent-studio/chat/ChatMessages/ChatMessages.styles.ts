import styled from 'styled-components';

export const MessagesArea = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
`;

export const EmptyState = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
`;

export const SuggestionList = styled.div`
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
`;

export const SuggestionItem = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  border-radius: 10px;
  text-align: left;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14.5px;
  font-weight: 400;
  color: rgba(229, 231, 235, 0.78);
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #f5f7fb;
  }
`;

export const SuggestionIconWrap = styled.svg`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: rgba(229, 231, 235, 0.5);
`;

export const SuggestionLabel = styled.span`
  line-height: 1.35;
`;
