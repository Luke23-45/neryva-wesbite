import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
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
  ({ label, hint, error, leftAdornment, id, ...rest }, ref) => {
    const inputId = id ?? rest.name ?? undefined;
    return (
      <Wrap>
        {label && (
          <Label htmlFor={inputId}>
            {label}
          </Label>
        )}
        <Field $hasError={!!error}>
          {leftAdornment && <Adornment>{leftAdornment}</Adornment>}
          <InputEl id={inputId} ref={ref} {...rest} />
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : hint ? <Hint>{hint}</Hint> : null}
      </Wrap>
    );
  },
);

TextInput.displayName = 'TextInput';
