import styled, { keyframes } from 'styled-components';

export const EmptyState = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 400;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.tint};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const SuggestionIconWrap = styled.svg`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.app.text.muted};
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
  max-width: 86%;
  padding: 12px 14px;
  border-radius: 14px;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${({ $role, theme }) =>
    $role === 'user'
      ? 'linear-gradient(135deg, rgba(192,132,252,0.18) 0%, rgba(37,99,235,0.18) 100%)'
      : theme.app.surface.tint};
  border: 1px solid
    ${({ $role, theme }) => ($role === 'user' ? 'rgba(192, 132, 252, 0.30)' : theme.app.border.strong)};
`;

export const BubbleMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const BubbleText = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.primary};
  overflow-wrap: break-word;
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
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
`;

export const TypingDot = styled.span<{ $delay: number }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.text.secondary};
  animation: ${blink} 1.2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

export const TypingRow = styled.div`
  display: flex;
  gap: 5px;
  padding: 4px 0;
`;

export const SuggestionInline = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  justify-content: center;
`;

export const SuggestionChip = styled.button`
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 999px;
  padding: 6px 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
