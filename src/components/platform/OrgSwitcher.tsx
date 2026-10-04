/**
 * The org picker for both shells (platform + studio). Switching is reactive
 * through `useOrg().setActive` — no navigation required; org-scoped query
 * keys do the cache separation. `onSwitch` lets a shell reset its own
 * navigation (the platform console bounces to its home; the studio stays).
 */
import { useOrg, ROLE_LABELS, type OrgRole } from '@/Context/OrgContext';
import { Dropdown } from '@components/common/ui/Dropdown';


export function OrgSwitcher({ onSwitch, ariaLabel = 'Switch organization' }: { onSwitch?: () => void; ariaLabel?: string }) {
  const { orgs, orgId, role, setActive } = useOrg();

  // Transient: the engine autocreates a personal org at signup, so an
  // authenticated session with zero orgs is mid-propagation — show nothing
  // rather than an empty select.
  if (orgs.length === 0) {
    return null;
  }

  return (
    <div style={{ maxWidth: 320 }}>
      <Dropdown
        variant="select"
        value={orgId ?? ''}
        onChange={(v) => {
          setActive(v);
          onSwitch?.();
        }}
        aria-label={ariaLabel}
        items={orgs.map((org) => ({
          value: org.orgId,
          label: `${org.name ?? org.orgId}${org.orgId === orgId && role ? ` · ${ROLE_LABELS[role as OrgRole] ?? role}` : ''}`,
        }))}
      />
    </div>
  );
}
