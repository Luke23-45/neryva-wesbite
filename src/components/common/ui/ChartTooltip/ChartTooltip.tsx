import { TooltipFrame, TooltipLabel, TooltipRow, TooltipKey, TooltipValue } from './ChartTooltip.styles';

type PayloadEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: { date?: string; label?: string };
};
type Props = {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string | number;
  formatter?: (value: number | string) => string;
};

export function ChartTooltip({ active, payload, label, formatter }: Props) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <TooltipFrame>
      {label != null && <TooltipLabel>{String(label)}</TooltipLabel>}
      {payload.map((p, i) => (
        <TooltipRow key={i}>
          <TooltipKey>
            <span style={{ background: p.color }} aria-hidden="true" />
            {p.name != null ? String(p.name) : p.dataKey ?? 'Value'}
          </TooltipKey>
          <TooltipValue>{formatter ? formatter(p.value as number) : p.value}</TooltipValue>
        </TooltipRow>
      ))}
    </TooltipFrame>
  );
}
