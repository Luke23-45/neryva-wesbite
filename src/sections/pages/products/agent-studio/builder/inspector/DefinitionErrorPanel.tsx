import styled from 'styled-components';
import { ActionButton } from '@components/common/ui/ActionButton';

/**
 * DefinitionErrorPanel — shared inline error for definition/identity
 * fetch failures (P0 state fix).
 *
 * An assistant whose definition can't load must never present an infinite
 * "Loading…" — this panel names the failure, states the consequence
 * (saved work is untouched), and offers a retry. Inline by design: no
 * modal, no gradient, tokens only.
 */

const Panel = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  background: ${({ theme }) => theme.app.status.error.bg};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
  max-width: ${({ theme }) => theme.containers.narrow};
`;

const Title = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.error.fg};
`;

const Body = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
  color: ${({ theme }) => theme.app.text.secondary};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.s1};
`;

export interface DefinitionErrorPanelProps {
  /** What failed to load, e.g. "Couldn't load the draft". */
  title: string;
  /** Retry the failed fetch. Absent → no retry button. */
  onRetry?: () => void;
}

export function DefinitionErrorPanel({ title, onRetry }: DefinitionErrorPanelProps) {
  return (
    <Panel role="alert">
      <Title>{title}</Title>
      <Body>Your saved work is untouched — retry to continue editing.</Body>
      {onRetry && (
        <Actions>
          <ActionButton size="sm" variant="secondary" onClick={onRetry}>
            Retry
          </ActionButton>
        </Actions>
      )}
    </Panel>
  );
}
