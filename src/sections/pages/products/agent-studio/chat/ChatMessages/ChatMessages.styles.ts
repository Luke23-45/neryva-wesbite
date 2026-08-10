import styled, { keyframes } from 'styled-components';

export const MessagesArea = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
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

/* ─── Message bubbles ─── */

export const MessageList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
`;

export const Bubble = styled.div<{ $role: 'user' | 'agent' }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 80%;
  padding: 12px 14px;
  border-radius: 14px;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${({ $role }) =>
    $role === 'user'
      ? 'linear-gradient(135deg, rgba(192,132,252,0.18) 0%, rgba(37,99,235,0.18) 100%)'
      : 'rgba(255,255,255,0.04)'};
  border: 1px solid
    ${({ $role }) =>
      $role === 'user'
        ? 'rgba(192, 132, 252, 0.30)'
        : 'rgba(255, 255, 255, 0.08)'};
`;

export const BubbleMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.55);
`;

export const BubbleText = styled.div`
  font-size: 14px;
  line-height: 1.55;
  color: rgba(245, 247, 251, 0.95);
`;

const blink = keyframes`
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
`;

export const TypingBubble = styled.div`
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

export const TypingDot = styled.span<{ $delay: number }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(229, 231, 235, 0.65);
  animation: ${blink} 1.2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

export const SuggestionInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  justify-content: center;
`;
