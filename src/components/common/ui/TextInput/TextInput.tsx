import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  Wrap,
  Label,
  Field,
  InputEl,
  Hint,
  ErrorText,
  Adornment,
} from './TextInput.styles';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leftAdornment?: ReactNode;
};

export const TextInput = forwardRef<HTMLInputElement, Props>(
  ({ label, hint, error, leftAdornment, id, 'aria-describedby': ariaDescribedBy, ...rest }, ref) => {
    // K-BUG5: the label must always resolve to the input — fall back to a
    // stable generated id when the caller passes neither id nor name.
    const generatedId = useId();
    const inputId = id ?? rest.name ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [ariaDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;
    return (
      <Wrap>
        {label && (
          <Label htmlFor={inputId}>
            {label}
          </Label>
        )}
        <Field $hasError={!!error}>
          {leftAdornment && <Adornment>{leftAdornment}</Adornment>}
          <InputEl
            id={inputId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...rest}
          />
        </Field>
        {/* K-BUG5: the hint persists alongside the error — guidance must not
            vanish exactly when the field is invalid. */}
        {hint ? <Hint id={hintId}>{hint}</Hint> : null}
        {error ? (
          <ErrorText id={errorId} role="alert">
            {error}
          </ErrorText>
        ) : null}
      </Wrap>
    );
  },
);

TextInput.displayName = 'TextInput';
