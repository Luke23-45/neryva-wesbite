import { ResponsiveContainer, AreaChart, Area } from 'recharts';

type Props = {
  data: Array<number>;
  color?: string;
  height?: number;
  width?: number | string;
};

export function Sparkline({ data, color = '#60a5fa', height = 36, width = '100%' }: Props) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
