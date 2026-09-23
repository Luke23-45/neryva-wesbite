import styled from 'styled-components';

export const ComposerWrap = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0 4px;
`;

export const FieldShell = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 10px 10px 12px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 16px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 8px 32px rgba(0, 0, 0, 0.35);
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.app.border.focus};
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.05) inset,
      0 12px 40px rgba(2, 6, 23, 0.55),
      0 0 0 4px rgba(37, 99, 235, 0.18);
  }
`;

export const PlusButton = styled.button`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

/** A3-48 — auto-sizing textarea (was a single-line input). */
export const Input = styled.textarea`
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  outline: none;
  resize: none;
  overflow-y: auto;
  max-height: 160px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 400;
  letter-spacing: -0.005em;
  line-height: 1.45;
  color: ${({ theme }) => theme.app.text.primary};
  padding: 4px 0;

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

/** Static mode indicator — becomes a picker when modes are real. */
export const SendButton = styled.button<{ $enabled: boolean }>`
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: ${({ $enabled }) => ($enabled ? 'pointer' : 'default')};
  border-radius: 10px;
  background: ${({ $enabled, theme }) =>
    $enabled ? theme.colors.gradients.primary : theme.app.surface.active};
  color: ${({ $enabled, theme }) => ($enabled ? '#fff' : theme.app.text.ghost)};
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ $enabled }) => ($enabled ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none')};

  &:active:not(:disabled) {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

/** A3-25 — spinner shown on the Stop button while the cancel is in flight. */
export const StopSpinner = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: stop-spin 0.7s linear infinite;
  @keyframes stop-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    border-top-color: rgba(255, 255, 255, 0.35);
  }
`;

export const HintRow = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.ghost};
  letter-spacing: -0.005em;
  text-align: center;
`;

export const HintKbd = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  display: inline-block;
  padding: 0 5px;
  margin: 0 2px;
  border-radius: 4px;
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  color: ${({ theme }) => theme.app.text.muted};
`;
