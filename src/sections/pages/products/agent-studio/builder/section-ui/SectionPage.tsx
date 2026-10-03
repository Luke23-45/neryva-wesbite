/**
 * section-ui — SectionPage: the shared page shell for Instructions, Role,
 * and Brand. Page header (title + progress pill + subtitle + optional
 * switch), the main column, and the right rail (outline, budget, tip).
 */

import type { ReactNode } from 'react';
import { Zap } from 'lucide-react';
import {
  Body,
  BudgetBar,
  BudgetFill,
  BudgetNote,
  BudgetNumber,
  BudgetRowLine,
  BudgetRows,
  BudgetRowValue,
  BudgetTotal,
  Group,
  GroupDescription,
  GroupHead,
  GroupLabel,
  GroupRule,
  Main,
  OutlineButton,
  OutlineLabel,
  OutlineList,
  OutlineMeta,
  OutlineRow,
  Page,
  PageHeader,
  PageSubtitle,
  PageTitle,
  PillDot,
  ProgressPill,
  Rail,
  RailCard,
  RailTitle,
  TipCard,
  TipIcon,
  TipText,
  TitleCluster,
  TitleRow,
} from './SectionPage.styles';
import { StatusIcon } from './BlockCard';
import type { BudgetRow, OutlineItem } from './types';

/* ── Page shell ──────────────────────────────────────────────── */

interface SectionPageProps {
  title: string;
  /** "N of M complete" pill — pass null for a custom pill or none. */
  progress?: { done: number; total: number } | null;
  /** Custom pill content (replaces the default progress pill). */
  pill?: ReactNode;
  subtitle: ReactNode;
  /** Right-aligned header control (e.g. the Compose/Preview/JSON switch). */
  headerControl?: ReactNode;
  /** Right rail content. */
  rail?: ReactNode;
  children: ReactNode;
}

export function SectionPage({ title, progress, pill, subtitle, headerControl, rail, children }: SectionPageProps) {
  return (
    <Page>
      <PageHeader>
        <TitleRow>
          <TitleCluster>
            <PageTitle>{title}</PageTitle>
            {pill ?? (progress ? (
              <ProgressPill>
                <PillDot aria-hidden="true" />
                {progress.done} of {progress.total} complete
              </ProgressPill>
            ) : null)}
          </TitleCluster>
          {headerControl}
        </TitleRow>
        <PageSubtitle>{subtitle}</PageSubtitle>
      </PageHeader>
      <Body>
        <Main>{children}</Main>
        {rail ? <Rail>{rail}</Rail> : null}
      </Body>
    </Page>
  );
}

/* ── Field group ─────────────────────────────────────────────── */

export function SectionGroup({
  label,
  description,
  children,
}: {
  label: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Group>
      <GroupHead aria-hidden="true">
        <GroupLabel>{label}</GroupLabel>
        <GroupRule />
      </GroupHead>
      {description ? <GroupDescription>{description}</GroupDescription> : null}
      {children}
    </Group>
  );
}

/* ── Right rail: on this page ────────────────────────────────── */

export function PageOutline({
  title = 'On this page',
  items,
  onSelect,
}: {
  title?: string;
  items: OutlineItem[];
  /** When provided, rows become buttons that scroll to the card. */
  onSelect?: (key: string) => void;
}) {
  return (
    <RailCard>
      <RailTitle>{title}</RailTitle>
      <OutlineList>
        {items.map((item) => (
          <OutlineRow key={item.key}>
            {onSelect ? (
              <OutlineButton type="button" onClick={() => onSelect(item.key)}>
                {/* K-D4: clickable rows are jump links, not options — the
                    hollow "not done" ring reads as a radio button, so only
                    the done check renders here. The meta text carries state. */}
                {item.done ? <StatusIcon done size={13} /> : null}
                <OutlineLabel>{item.label}</OutlineLabel>
                <OutlineMeta>{item.meta}</OutlineMeta>
              </OutlineButton>
            ) : (
              <>
                <StatusIcon done={item.done} size={13} />
                <OutlineLabel>{item.label}</OutlineLabel>
                <OutlineMeta>{item.meta}</OutlineMeta>
              </>
            )}
          </OutlineRow>
        ))}
      </OutlineList>
    </RailCard>
  );
}

/* ── Right rail: context budget ──────────────────────────────── */

interface ContextBudgetProps {
  title?: string;
  /** Total consumed chars (the bar numerator). */
  total: number;
  /** Hard cap (the bar denominator). */
  limit: number;
  rows: BudgetRow[];
  /** e.g. '31,399 chars of headroom · ~342 tokens (est.)' */
  note?: ReactNode;
}

export function ContextBudget({ title = 'Context budget', total, limit, rows, note }: ContextBudgetProps) {
  const pct = limit > 0 ? (total / limit) * 100 : 0;
  return (
    <RailCard>
      <RailTitle>{title}</RailTitle>
      <div>
        <BudgetTotal>
          <BudgetNumber>{total.toLocaleString()}</BudgetNumber>
          <span>/ {limit.toLocaleString()} chars</span>
        </BudgetTotal>
        <div style={{ marginTop: 8 }}>
          <BudgetBar role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <BudgetFill $pct={pct} />
          </BudgetBar>
        </div>
      </div>
      {rows.length > 0 && (
        <BudgetRows>
          {rows.map((row) => (
            <BudgetRowLine key={row.key}>
              <span>{row.label}</span>
              <BudgetRowValue>{row.chars.toLocaleString()}</BudgetRowValue>
            </BudgetRowLine>
          ))}
        </BudgetRows>
      )}
      {note ? <BudgetNote>{note}</BudgetNote> : null}
    </RailCard>
  );
}

/* ── Right rail: micro tip ───────────────────────────────────── */

export function MicroTip({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <TipCard title={title}>
      <TipIcon aria-hidden="true">
        <Zap size={13} strokeWidth={2} />
      </TipIcon>
      <TipText>{children}</TipText>
    </TipCard>
  );
}
