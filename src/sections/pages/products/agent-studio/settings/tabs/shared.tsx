import styled from 'styled-components';
import { Save } from 'lucide-react';

type Props = {
  onSave: () => void;
  saveLabel?: string;
};

export function SaveRow({ onSave, saveLabel = 'Save changes' }: Props) {
  return (
    <Row>
      <Button
        as="button"
        type="button"
        onClick={() => {
          onSave();
        }}
      >
        <Save size={13} strokeWidth={1.8} />
        {saveLabel}
      </Button>
    </Row>
  );
}

const Row = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #c084fc 0%, #2563eb 100%);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
`;
