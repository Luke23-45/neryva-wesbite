import styled from 'styled-components';

const Pill = styled.div`
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 14px;
  border-radius: 17px;
  background: #201a12;
  border: 1px solid #3a2a16;
  font-size: 12px;
  color: #c3ccd9;
  white-space: nowrap;
`;

const AmberDot = styled.span`
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: #f5a524;
`;

const ReviewButton = styled.button`
  padding: 4px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #58a6ff;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    color: #8fbdff;
  }

  &:focus-visible {
    outline: 2px solid #2f7fe0;
    outline-offset: 1px;
  }
`;

export interface IssuesPillProps {
  blockers: number;
  suggestions: number;
  onReviewIssues: () => void;
}

/**
 * v10 issues pill (agent-builder-v10 §3 V8): floating bottom-center,
 * rendered only when there is something to report. Counts come from the
 * same readiness derivation as the palette health card — never invented.
 * A zero segment is omitted, never rendered as "0 blocking".
 */
export function IssuesPill({ blockers, suggestions, onReviewIssues }: IssuesPillProps) {
  if (blockers <= 0 && suggestions <= 0) return null;

  const segments: string[] = [];
  if (blockers > 0) segments.push(`${blockers} blocking issues`);
  if (suggestions > 0) segments.push(`${suggestions} suggestions`);

  return (
    <Pill role="status" aria-label={`${segments.join(' · ')} — review issues`}>
      <AmberDot aria-hidden="true" />
      <span>{segments.join(' · ')}</span>
      <ReviewButton type="button" onClick={onReviewIssues}>
        Review
      </ReviewButton>
    </Pill>
  );
}
