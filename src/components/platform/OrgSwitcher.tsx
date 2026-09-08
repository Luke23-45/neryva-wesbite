/**
 * The org picker for both shells (platform + studio). Switching is reactive
 * through `useOrg().setActive` — no navigation required; org-scoped query
 * keys do the cache separation. `onSwitch` lets a shell reset its own
 * navigation (the platform console bounces to its home; the studio stays).
 */
import { ChevronDown } from 'lucide-react';
import styled from 'styled-components';
import { useOrg, ROLE_LABELS, type OrgRole } from '@/Context/OrgContext';

const Select = styled.select`
  background: rgba(255, 255, 255, 0.05);
  color: #eceef4;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  max-width: 240px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid rgba(139, 143, 248, 0.6);
    outline-offset: 1px;
  }

  option {
    background: #14151c;
    color: #eceef4;
  }
`;

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
`;

export function OrgSwitcher({ onSwitch, ariaLabel = 'Switch organization' }: { onSwitch?: () => void; ariaLabel?: string }) {
  const { orgs, orgId, role, setActive } = useOrg();

  // Transient: the engine autocreates a personal org at signup, so an
  // authenticated session with zero orgs is mid-propagation — show nothing
  // rather than an empty select.
  if (orgs.length === 0) {
    return null;
  }

  return (
    <Wrap>
      <Select
        value={orgId ?? ''}
        onChange={(e) => {
          setActive(e.target.value);
          onSwitch?.();
        }}
        aria-label={ariaLabel}
      >
        {orgs.map((org) => (
          <option key={org.orgId} value={org.orgId}>
            {org.name ?? org.orgId}
            {org.orgId === orgId && role ? ` · ${ROLE_LABELS[role as OrgRole] ?? role}` : ''}
          </option>
        ))}
      </Select>
      <ChevronDown size={13} opacity={0.4} aria-hidden="true" />
    </Wrap>
  );
}
