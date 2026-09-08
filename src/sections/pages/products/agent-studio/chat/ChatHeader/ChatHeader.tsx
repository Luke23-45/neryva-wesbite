import { Plus, Bot } from 'lucide-react';
import styled from 'styled-components';
import {
  Bar,
  LeftCluster,
  Crumbs,
  Crumb,
  CrumbDivider,
} from './ChatHeader.styles';

/**
 * The chat header (ledger C-2) — the real thread title and the bound
 * agent, plus new-thread. The model picker was removed: chat runs through
 * the engine's conversations module and the model allowlist registry is
 * ⛔ E-1 — a picker that only changed a label was a stub.
 */

const StreamingPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 9px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.azure.bg};
  border: 1px solid ${({ theme }) => theme.app.status.azure.border};
  color: ${({ theme }) => theme.app.status.azure.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const AgentBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: ${({ theme }) => theme.app.type.micro};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 24ch;
`;

const NewThreadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 7px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

type Props = {
  title: string;
  agentName: string | null;
  streaming: boolean;
  onNewThread: () => void;
};

export function ChatHeader({ title, agentName, streaming, onNewThread }: Props) {
  return (
    <Bar>
      <LeftCluster>
        <Crumbs aria-label="Breadcrumb">
          <Crumb>Studio</Crumb>
          <CrumbDivider aria-hidden="true">/</CrumbDivider>
          <Crumb>{title}</Crumb>
        </Crumbs>

        {agentName && (
          <AgentBadge>
            <Bot size={11} strokeWidth={1.8} aria-hidden="true" />
            {agentName}
          </AgentBadge>
        )}

        {streaming && <StreamingPill>working…</StreamingPill>}

        <NewThreadButton type="button" onClick={onNewThread}>
          <Plus size={12} strokeWidth={2} />
          New thread
        </NewThreadButton>
      </LeftCluster>
    </Bar>
  );
}
