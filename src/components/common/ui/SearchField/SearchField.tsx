import type { ChangeEvent } from 'react';
import { Search } from 'lucide-react';
import { Field, Input } from './SearchField.styles';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  width?: number;
};

/** Compact search field for dashboard toolbars. */
export function SearchField({ value, onChange, placeholder, ariaLabel, width }: Props) {
  return (
    <Field $width={width}>
      <Search size={13} strokeWidth={1.7} aria-hidden="true" />
      <Input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
    </Field>
  );
}
