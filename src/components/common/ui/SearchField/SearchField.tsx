import { useRef, type ChangeEvent } from 'react';
import { Search, X } from 'lucide-react';
import { ClearButton, Field, Input } from './SearchField.styles';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  width?: number | string;
};

/**
 * Compact search field for dashboard toolbars.
 *
 * Professional behaviors: 36px control height (aligns with toolbar
 * buttons), visible focus border, and a clear (×) button whenever text is
 * present (clears + refocuses, so keyboard flow isn't broken).
 *
 * No Escape handling here on purpose: pages own Escape themselves (e.g.
 * the catalog drawer distinguishes Escape-in-search from Escape-elsewhere),
 * and a shared stopPropagation would silently break those contracts.
 */
export function SearchField({ value, onChange, placeholder, ariaLabel, width }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };
  return (
    <Field $width={width}>
      <Search size={14} strokeWidth={1.8} aria-hidden="true" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
      {value.length > 0 && (
        <ClearButton type="button" onClick={clear} aria-label="Clear search">
          <X size={13} strokeWidth={2} aria-hidden="true" />
        </ClearButton>
      )}
    </Field>
  );
}
