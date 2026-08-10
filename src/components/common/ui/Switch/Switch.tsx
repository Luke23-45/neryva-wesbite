import { SwitchRoot, Track, Thumb, Label } from './Switch.styles';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
};

export function Switch({ checked, onChange, label, disabled, id }: Props) {
  return (
    <SwitchRoot>
      <Track
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        $checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        id={id}
      >
        <Thumb $checked={checked} />
      </Track>
      {label && <Label htmlFor={id}>{label}</Label>}
    </SwitchRoot>
  );
}
