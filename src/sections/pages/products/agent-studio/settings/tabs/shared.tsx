import styled from 'styled-components';
import { Save } from 'lucide-react';
import { ActionButton } from '@components/common/ui/ActionButton';

type Props = {
  onSave: () => void;
  saveLabel?: string;
};

/** Footer row shared by every settings tab — the one "save" affordance. */
export function SaveRow({ onSave, saveLabel = 'Save changes' }: Props) {
  return (
    <Row>
      <ActionButton onClick={onSave}>
        <Save size={13} strokeWidth={1.8} />
        {saveLabel}
      </ActionButton>
    </Row>
  );
}

const Row = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
`;
