import { Check, X } from 'lucide-react';
import type { PublishReadinessRow } from '@hooks/studio/useAgentAuthoring';
import type { PublishEditTarget } from '../lib/publish-model';
import {
  CheckBody,
  CheckIcon,
  CheckRow,
  CheckTitle,
  ExtraList,
  FixJump,
  FixRouteLink,
  FixZone,
  Rows,
} from './ReadinessRows.styles';

/**
 * Shared readiness rows (C14 — the ship section and the detail panel render
 * THESE, never two row implementations). Tone is dot + word state only;
 * fixes ride the row: builder jumps via onJump, detail links out.
 */

export function ReadinessRows({
  rows,
  acknowledged,
  onJump,
  buildHref,
  idPrefix,
}: {
  rows: PublishReadinessRow[];
  acknowledged: boolean;
  /** Builder jump (absent on detail — rows link to the builder instead). */
  onJump?: (target: PublishEditTarget) => void;
  buildHref: string;
  idPrefix: string;
}) {
  return (
    <Rows>
      {rows.map((row) => {
        const acked = row.ok === false && row.ackable && acknowledged;
        const tone = row.ok === true ? 'success' : acked ? 'warning' : row.ok === false ? 'error' : 'neutral';
        return (
          <CheckRow key={row.id} id={`${idPrefix}-row-${row.id}`} tabIndex={-1}>
            <CheckIcon $tone={tone}>
              {row.ok === true ? (
                <Check size={15} />
              ) : row.ok === false && !acked ? (
                <X size={15} />
              ) : acked ? (
                <Check size={15} />
              ) : (
                <span aria-hidden="true">○</span>
              )}
            </CheckIcon>
            <CheckBody>
              <CheckTitle>{row.title}</CheckTitle>
              <div>
                {row.ok === null ? 'Checking…' : row.detail}
                {acked ? ' — acknowledged, ships degraded (audited).' : ''}
              </div>
              {row.extra && row.extra.length > 0 && (
                <ExtraList>
                  {row.extra.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ExtraList>
              )}
              {row.ok === false && !acked && (
                <FixZone>
                  {row.fix.editTarget && onJump ? (
                    <FixJump type="button" onClick={() => onJump(row.fix.editTarget as PublishEditTarget)}>
                      {row.fix.fixLabel} →
                    </FixJump>
                  ) : row.fix.fixRoute ? (
                    <FixRouteLink to={row.fix.fixRoute}>
                      {row.fix.fixLabel} →
                    </FixRouteLink>
                  ) : row.fix.editTarget ? (
                    <FixRouteLink to={buildHref}>
                      {row.fix.fixLabel} →
                    </FixRouteLink>
                  ) : null}
                </FixZone>
              )}
            </CheckBody>
          </CheckRow>
        );
      })}
    </Rows>
  );
}
