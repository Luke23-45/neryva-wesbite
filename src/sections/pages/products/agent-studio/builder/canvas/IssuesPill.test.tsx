// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { IssuesPill } from './IssuesPill';

describe('IssuesPill', () => {
  it('renders nothing when there are no blockers and no suggestions', () => {
    const { container } = render(<IssuesPill blockers={0} suggestions={0} onReviewIssues={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders both segments when both are nonzero', () => {
    render(<IssuesPill blockers={2} suggestions={3} onReviewIssues={vi.fn()} />);
    expect(screen.getByText('2 blocking issues · 3 suggestions')).toBeTruthy();
  });

  it('omits the suggestions segment when it is zero (never "0 suggestions")', () => {
    render(<IssuesPill blockers={1} suggestions={0} onReviewIssues={vi.fn()} />);
    expect(screen.getByText('1 blocking issues')).toBeTruthy();
    expect(screen.queryByText(/suggestions/)).toBeNull();
  });

  it('omits the blockers segment when it is zero (never "0 blocking")', () => {
    render(<IssuesPill blockers={0} suggestions={4} onReviewIssues={vi.fn()} />);
    expect(screen.getByText('4 suggestions')).toBeTruthy();
    expect(screen.queryByText(/blocking/)).toBeNull();
  });

  it('opens the issues surface when Review is clicked', () => {
    const onReviewIssues = vi.fn();
    render(<IssuesPill blockers={2} suggestions={0} onReviewIssues={onReviewIssues} />);
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(onReviewIssues).toHaveBeenCalledTimes(1);
  });
});
