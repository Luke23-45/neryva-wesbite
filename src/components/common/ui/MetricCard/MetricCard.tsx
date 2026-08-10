import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Card,
  Label,
  Value,
  Row,
  Delta,
  SparkWrap,
  Footnote,
} from './MetricCard.styles';

type Props = {
  label: string;
  value: string;
  delta?: { value: string; positive?: boolean };
  spark?: ReactNode;
  footnote?: string;
};

export function MetricCard({ label, value, delta, spark, footnote }: Props) {
  return (
    <Card>
      <Label>{label}</Label>
      <Value>{value}</Value>
      {spark && <SparkWrap>{spark}</SparkWrap>}
      <Row>
        {delta && (
          <Delta $positive={delta.positive ?? false}>
            {delta.positive ? <ArrowUpRight size={12} strokeWidth={2} /> : <ArrowDownRight size={12} strokeWidth={2} />}
            {delta.value}
          </Delta>
        )}
        {footnote && <Footnote>{footnote}</Footnote>}
      </Row>
    </Card>
  );
}
