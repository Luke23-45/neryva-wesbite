import {
  ResponsiveContainer,
  AreaChart as RAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from 'recharts';
import { ChartTooltip } from '@components/common/ui/ChartTooltip';

type Series = {
  dataKey: string;
  name?: string;
  color: string;
};

type Props = {
  data: Array<Record<string, number | string>>;
  xKey?: string;
  series: Series[];
  height?: number;
  yFormatter?: (v: number) => string;
  xFormatter?: (v: string) => string;
};

export function StudioAreaChart({
  data,
  xKey = 'date',
  series,
  height = 280,
  yFormatter,
  xFormatter,
}: Props) {
  const renderTooltip = (props: TooltipProps<number | string, string | number>) => (
    <ChartTooltip
      active={props.active}
      label={props.label}
      payload={props.payload?.map((p) => ({
        name: typeof p.name === 'string' || typeof p.name === 'number' ? p.name : undefined,
        value: Array.isArray(p.value) ? p.value[0] : p.value,
        color: p.color,
        dataKey: typeof p.dataKey === 'string' ? p.dataKey : undefined,
      }))}
      formatter={(v) => (yFormatter ? yFormatter(Number(v)) : String(v))}
    />
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RAreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke="rgba(229, 231, 235, 0.45)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={xFormatter}
        />
        <YAxis
          stroke="rgba(229, 231, 235, 0.45)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={yFormatter}
          width={36}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1 }}
          content={renderTooltip}
        />
        {series.map((s) => (
          <Area
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name ?? s.dataKey}
            stroke={s.color}
            strokeWidth={1.75}
            fill={s.color}
            fillOpacity={0.12}
          />
        ))}
      </RAreaChart>
    </ResponsiveContainer>
  );
}
