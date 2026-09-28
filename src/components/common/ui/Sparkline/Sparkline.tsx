import { ResponsiveContainer, AreaChart, Area } from 'recharts';

type Props = {
  data: Array<number>;
  color?: string;
  height?: number;
  width?: number | string;
};

export function Sparkline({ data, color = '#60a5fa', height = 36, width = '100%' }: Props) {
  const points = data.map((v, i) => ({ i, v }));
  const id = `spark-${color.replace('#', '')}-${height}`;
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
