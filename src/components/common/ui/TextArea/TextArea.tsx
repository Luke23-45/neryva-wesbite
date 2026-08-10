import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { Wrap, Label, Area, Hint, ErrorText } from './TextArea.styles';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, hint, error, id, ...rest }, ref) => {
    const fieldId = id ?? rest.name ?? undefined;
    return (
      <Wrap>
        {label && <Label htmlFor={fieldId}>{label}</Label>}
        <Area id={fieldId} ref={ref} $hasError={!!error} {...rest} />
        {error ? <ErrorText>{error}</ErrorText> : hint ? <Hint>{hint}</Hint> : null}
      </Wrap>
    );
  },
);

TextArea.displayName = 'TextArea';
