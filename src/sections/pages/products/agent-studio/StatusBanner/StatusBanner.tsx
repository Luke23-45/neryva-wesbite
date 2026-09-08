/**
 * Platform-status strip for the studio shell (ledger S-5): polls
 * /console/status and surfaces degradation/outage — operational renders
 * nothing, a failing probe stays silent (a status feed must never become
 * its own incident).
 */
import { Link } from '@tanstack/react-router';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import styled from 'styled-components';
import { useStudioStatus } from '@hooks/studio/useStudioStatus';

const Strip = styled.div<{ $tone: 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  border: 1px solid
    ${({ $tone, theme }) => ($tone === 'error' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
  background: ${({ $tone }) =>
    $tone === 'error' ? 'rgba(248, 113, 113, 0.08)' : 'rgba(245, 185, 66, 0.08)'};
  color: ${({ theme }) => theme.app.text.primary};
`;

const StripText = styled.p`
  margin: 0;
  flex: 1;
  line-height: 1.45;

  strong {
    font-weight: 600;
  }
`;

const StripLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

export function StatusBanner() {
  const { data } = useStudioStatus();

  if (!data || data.overall === 'operational' || data.degradedComponents.length === 0) {
    return null;
  }

  const tone = data.overall === 'outage' ? 'error' : 'warning';
  const names = data.degradedComponents.slice(0, 3).join(', ');
  const suffix = data.degradedComponents.length > 3 ? ` and ${data.degradedComponents.length - 3} more` : '';

  return (
    <Strip $tone={tone} role="status">
      <TriangleAlert size={15} aria-hidden="true" />
      <StripText>
        <strong>{data.overall === 'outage' ? 'Platform outage' : 'Partial degradation'}.</strong>{' '}
        {names}
        {suffix} {data.overall === 'outage' ? 'are down' : 'are degraded'} — your data is safe.
      </StripText>
      <StripLink to="/platform/status">
        Platform status <ArrowRight size={12} aria-hidden="true" />
      </StripLink>
    </Strip>
  );
}
