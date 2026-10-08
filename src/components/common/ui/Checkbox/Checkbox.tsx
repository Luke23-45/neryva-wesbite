import { useId, type ReactNode } from 'react';
import { Box, Check, ErrorText, Label, Row } from './Checkbox.styles';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Clickable text. Omit for a bare box (then supply an aria-label). */
  children?: ReactNode;
  disabled?: boolean;
  error?: string;
  'aria-label'?: string;
};

/**
 * Checkbox for explicit acknowledgements ("I accept this ships degraded").
 *
 * Deliberately not a `Switch`: a switch implies an immediate setting change,
 * an acknowledgement is consent recorded before a later action. The
 * acknowledgement gates on Publish, Rollback and Clone all use this.
 *
 * The native input stays in the DOM (visually hidden, not `display:none`) so
 * form semantics, keyboard activation and `:focus-visible` all keep working.
 */
export function Checkbox({ checked, onChange, children, disabled, error, ...aria }: Props) {
  const id = useId();
  const hasLabel = children != null;

  return (
    <div>
      <Row>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => {
            // A disabled control must not be able to report a change, even if
            // something dispatches a click straight at the node (jsdom does).
            if (disabled) return;
            onChange(e.target.checked);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...aria}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            margin: 0,
            pointerEvents: 'none',
          }}
        />
        <Box $checked={checked} $disabled={disabled} aria-hidden="true">
          <Check $checked={checked} viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7.4 5.6 10.5 11.5 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Check>
        </Box>
        {hasLabel && <Label>{children}</Label>}
      </Row>
      {error && (
        <ErrorText id={`${id}-error`} role="alert">
          {error}
        </ErrorText>
      )}
    </div>
  );
}