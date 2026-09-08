import styled from 'styled-components';
import { Save } from 'lucide-react';
import { ActionButton } from '@components/common/ui/ActionButton';

type Props = {
  onSave: () => void;
  saveLabel?: string;
  /** Renders without the footer chrome — for use inside a Panel header action. */
  inline?: boolean;
  /** Real mutations disable the affordance while pending / when gated. */
  disabled?: boolean;
};

/** Footer row shared by every settings tab — the one "save" affordance. */
export function SaveRow({ onSave, saveLabel = 'Save changes', inline = false, disabled = false }: Props) {
  return (
    <Row $inline={inline}>
      <ActionButton size={inline ? 'sm' : 'md'} onClick={onSave} disabled={disabled}>
        <Save size={13} strokeWidth={1.8} />
        {saveLabel}
      </ActionButton>
    </Row>
  );
}

const Row = styled.div<{ $inline: boolean }>`
  display: flex;
  justify-content: flex-end;
  ${({ $inline, theme }) =>
    $inline
      ? ''
      : `
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid ${theme.app.border.hairline};
  `}
`;

