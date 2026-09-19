import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Check, X } from 'lucide-react';
import type { PublishReadinessRow } from '@hooks/studio/useAgentAuthoring';
import type { PublishEditTarget } from '../lib/publish-model';

/**
 * Shared readiness rows (C14 — the ship section and the detail panel render
 * THESE, never two row implementations). Tone is dot + word state only;
 * fixes ride the row: builder jumps via onJump, detail links out.
 */

const CheckRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 9px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 6px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

const CheckIcon = styled.span<{ $tone: 'success' | 'warning' | 'error' | 'neutral' }>`
  color: ${({ $tone, theme }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : theme.app.text.secondary};
  display: inline-flex;
  margin-top: 2px;
`;

const CheckBody = styled.div`
  flex: 1;
  font-size: 13px;
  line-height: 1.55;
`;

const CheckTitle = styled.div`
  font-weight: 600;
  margin-bottom: 2px;
`;

const FixJump = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font-size: 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

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
    <div>
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
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {row.extra.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {row.ok === false && !acked && (
                <div style={{ marginTop: 4 }}>
                  {row.fix.editTarget && onJump ? (
                    <FixJump type="button" onClick={() => onJump(row.fix.editTarget as PublishEditTarget)}>
                      {row.fix.fixLabel} →
                    </FixJump>
                  ) : row.fix.fixRoute ? (
                    <Link to={row.fix.fixRoute} style={{ fontSize: 12 }}>
                      {row.fix.fixLabel} →
                    </Link>
                  ) : row.fix.editTarget ? (
                    <Link to={buildHref} style={{ fontSize: 12 }}>
                      {row.fix.fixLabel} →
                    </Link>
                  ) : null}
                </div>
              )}
            </CheckBody>
          </CheckRow>
        );
      })}
    </div>
  );
}
