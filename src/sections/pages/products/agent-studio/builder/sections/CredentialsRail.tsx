import { RailCard, RailTitle } from '../section-ui/SectionPage.styles';
import { RailDot, RailLabel, RailRow, RailValue } from '../inspector/ToolsSection.styles';
import { useProviderCredentials } from '@hooks/studio/useSetupProviders';
import { useEnterpriseStatus } from '@hooks/engine/billing';

/**
 * CredentialsNode's "On this page" rail (CR-BUG3 follow-up: the SectionPage
 * shell was added without rail content). Reads the same cached queries the
 * panel reads — React Query dedupes by key, so this costs no extra fetch.
 * Every value is honest: loading, error, and no-permission states all read
 * as what they are, never as a healthy zero.
 */
export function CredentialsRail({ canRead }: { canRead: boolean }) {
  const credentials = useProviderCredentials({ enabled: canRead });
  const enterprise = useEnterpriseStatus({ enabled: canRead });

  const credCount = credentials.data?.length;
  const credValue = !canRead
    ? '—'
    : credentials.isError
      ? 'unavailable'
      : credCount === undefined
        ? '…'
        : credCount === 0
          ? 'none'
          : `${credCount} configured`;
  const keyMgmt = !canRead
    ? '—'
    : enterprise.isError
      ? 'unavailable'
      : enterprise.data === undefined
        ? '…'
        : enterprise.data === true
          ? 'Enterprise BYOK'
          : 'Neryva-managed';

  return (
    <RailCard>
      <RailTitle>On this page</RailTitle>
      <RailRow>
        <RailLabel>
          <RailDot $tone={credCount !== undefined && credCount > 0 ? 'ok' : 'muted'} aria-hidden="true" />
          Provider credentials
        </RailLabel>
        <RailValue>{credValue}</RailValue>
      </RailRow>
      <RailRow>
        <RailLabel>
          <RailDot $tone="muted" aria-hidden="true" />
          Key management
        </RailLabel>
        <RailValue>{keyMgmt}</RailValue>
      </RailRow>
    </RailCard>
  );
}
