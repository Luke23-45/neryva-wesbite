/**
 * section-ui — RulesBuilder: the repeatable-block card.
 *
 * One row per rule (truncated text, mode tag, reorder, edit, delete),
 * an "Add rule" action that creates the row and opens the focused
 * editor for it, and a "Browse examples" entry point to the sample
 * gallery. The empty state matches the SVG's dashed drop zone.
 */

import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { StatusIcon } from './BlockCard';
import { stripMarkdown } from './strip-markdown';
import {
  AddButton,
  BrowseLink,
  CountPill,
  DashedActions,
  DashedArea,
  DashedHint,
  DashedTitle,
  ModeTag,
  RowButton,
  RuleEmpty,
  RuleList,
  RuleRow,
  RuleText,
  RulesCard,
  RulesFooter,
  RulesHead,
  RulesHelper,
  RulesTitle,
} from './RulesBuilder.styles';
import type { ModalBlock } from './types';

export interface RuleEntry {
  id: string;
  block: ModalBlock;
}

interface RulesBuilderProps {
  title: string;
  helper?: string;
  emptyTitle: string;
  emptyHint: string;
  rules: RuleEntry[];
  countLabel: (n: number) => string;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onBrowseExamples: () => void;
  readOnly?: boolean;
}

function modeLabel(mode: ModalBlock['mode']): string {
  if (mode === 'markdown') return 'md';
  if (mode === 'json') return 'json';
  return 'raw';
}

export function RulesBuilder({
  title,
  helper,
  emptyTitle,
  emptyHint,
  rules,
  countLabel,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  onBrowseExamples,
  readOnly,
}: RulesBuilderProps) {
  const done = rules.some((r) => r.block.content.trim() !== '');

  return (
    <RulesCard>
      <RulesHead>
        <StatusIcon done={done} />
        <RulesTitle>{title}</RulesTitle>
        <CountPill>{countLabel(rules.length)}</CountPill>
      </RulesHead>
      {helper ? <RulesHelper>{helper}</RulesHelper> : null}

      {rules.length === 0 ? (
        <DashedArea>
          <DashedTitle>{emptyTitle}</DashedTitle>
          <DashedHint>{emptyHint}</DashedHint>
          {!readOnly ? (
            <DashedActions>
              <AddButton type="button" onClick={onAdd}>
                Add rule
              </AddButton>
              <BrowseLink type="button" onClick={onBrowseExamples}>
                Browse examples
              </BrowseLink>
            </DashedActions>
          ) : null}
        </DashedArea>
      ) : (
        <>
          <RuleList>
            {rules.map((rule, index) => {
              const plain = stripMarkdown(rule.block.content);
              const singleLine = plain.split('\n').filter(Boolean)[0] ?? '';
              return (
                <RuleRow key={rule.id}>
                  {singleLine ? (
                    <RuleText title={plain}>{singleLine}</RuleText>
                  ) : (
                    <RuleEmpty>Empty rule — open to write it.</RuleEmpty>
                  )}
                  <ModeTag>{modeLabel(rule.block.mode)}</ModeTag>
                  {!readOnly ? (
                    <>
                      <RowButton
                        type="button"
                        title="Move up"
                        aria-label={`Move rule ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => onMove(rule.id, -1)}
                      >
                        <ChevronUp size={14} strokeWidth={1.9} />
                      </RowButton>
                      <RowButton
                        type="button"
                        title="Move down"
                        aria-label={`Move rule ${index + 1} down`}
                        disabled={index === rules.length - 1}
                        onClick={() => onMove(rule.id, 1)}
                      >
                        <ChevronDown size={14} strokeWidth={1.9} />
                      </RowButton>
                      <RowButton
                        type="button"
                        title="Edit rule"
                        aria-label={`Edit rule ${index + 1}`}
                        onClick={() => onEdit(rule.id)}
                      >
                        <Pencil size={13} strokeWidth={1.9} />
                      </RowButton>
                      <RowButton
                        type="button"
                        title="Delete rule"
                        aria-label={`Delete rule ${index + 1}`}
                        onClick={() => onDelete(rule.id)}
                      >
                        <Trash2 size={13} strokeWidth={1.9} />
                      </RowButton>
                    </>
                  ) : null}
                </RuleRow>
              );
            })}
          </RuleList>
          {!readOnly ? (
            <RulesFooter>
              <AddButton type="button" onClick={onAdd}>
                Add rule
              </AddButton>
              <BrowseLink type="button" onClick={onBrowseExamples}>
                Browse examples
              </BrowseLink>
            </RulesFooter>
          ) : null}
        </>
      )}
    </RulesCard>
  );
}
