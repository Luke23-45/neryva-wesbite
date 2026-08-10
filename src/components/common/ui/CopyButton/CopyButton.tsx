import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './CopyButton.styles';

type Props = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({ value, label = 'Copy', className }: Props) {
  const [done, setDone] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast.success('Copied to clipboard');
      window.setTimeout(() => setDone(false), 1400);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <Button type="button" onClick={onClick} className={className} aria-label={label}>
      {done ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.7} />}
      <span>{done ? 'Copied' : label}</span>
    </Button>
  );
}
