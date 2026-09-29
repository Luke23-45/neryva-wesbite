import styled from 'styled-components';
import type { WebhookEventCatalogEntry } from '@hooks/studio/useWebhooks';

/**
 * Webhook form primitives shared by the WebhooksView modal-that-remains
 * (rotate secret reveal) and the new dedicated sections (webhook new /
 * edit). Carried over verbatim from the dialog-era WebhooksView — the
 * event picker, validation copy, and secret reveal keep the exact look
 * and wording the modals had. Validation helpers live in
 * `./webhook-section-utils` so this file only exports components and
 * styled constants.
 */

/** Multi-select event picker — verbatim from the create/edit modals. */
export function EventSelector({
  catalog,
  selected,
  onChange,
}: {
  catalog: WebhookEventCatalogEntry[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const allSelected = selected.includes('*');
  const toggle = (type: string) => {
    if (type === '*') {
      onChange(allSelected ? [] : ['*']);
      return;
    }
    const without = selected.filter((t) => t !== '*' && t !== type);
    onChange(selected.includes(type) ? without : [...without, type]);
  };
  return (
    <div>
      <FieldLabel>Subscribed events</FieldLabel>
      <EventGrid style={{ padding: 0 }}>
        <ToggleChip $active={allSelected} onClick={() => toggle('*')} title="Receive every event type">
          All events (*)
        </ToggleChip>
        {catalog.map((e) => (
          <ToggleChip
            key={e.type}
            $active={!allSelected && selected.includes(e.type)}
            onClick={() => toggle(e.type)}
            title={e.description}
          >
            {e.type}
          </ToggleChip>
        ))}
      </EventGrid>
      <HintText>
        {allSelected
          ? 'This webhook receives every event type.'
          : selected.length === 0
            ? 'Select at least one event type — a webhook with no subscriptions never fires.'
            : `${selected.length} event type${selected.length === 1 ? '' : 's'} selected.`}
      </HintText>
    </div>
  );
}

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const RotateNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;

  code {
    font-family: ${({ theme }) => theme.typography.fonts.mono};
  }
`;

export const SecretBox = styled.div`
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.strong};

  code {
    flex: 1;
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: ${({ theme }) => theme.app.type.caption};
    color: ${({ theme }) => theme.app.text.primary};
    word-break: break-all;
    line-height: 1.5;
  }
`;

export const EventGrid = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 14px 22px;
`;

export const ToggleChip = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  cursor: pointer;
  background: ${({ $active, theme }) => ($active ? theme.app.status.lilac.bg : 'transparent')};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.app.status.lilac.border : theme.app.border.default)};
  color: ${({ $active, theme }) => ($active ? theme.app.text.primary : theme.app.text.secondary)};
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const FieldLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 8px;
`;

export const HintText = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 8px;
  line-height: 1.5;
`;

export const StatusToggle = styled.div`
  display: flex;
  gap: 8px;
`;
