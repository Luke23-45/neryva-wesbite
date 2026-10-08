import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { useOrg } from '@/Context/OrgContext';
import { canPerform } from '@lib/engine/capabilities';
import {
  useActivateChannelsProduct,
  useChannelsProduct,
} from '@hooks/studio/useSetupChannels';

/**
 * Channels product gate — the workspace-level prerequisite for every
 * channel account (the engine refuses creation with
 * `channels are not entitled` when the product has no entitlement row).
 *
 * - enabled/unknown: renders nothing (list/form as today; on unknown the
 *   backend remains the enforcer, so a failed entitlement read never hides
 *   working UI).
 * - missing/expired: enable panel. Owners/billing get a one-click
 *   self-serve enable (audited PAYG activation, idempotent); everyone else
 *   gets an ask-an-owner note — never a button that would 403.
 * - past_due/suspended: billing-blocked note (re-activation would conflict;
 *   paying is how you recover).
 */
export function ChannelsEntitlementGate() {
  const { role } = useOrg();
  const product = useChannelsProduct();
  const activate = useActivateChannelsProduct();
  const canEnable = canPerform(role, 'active', 'billing:manage');

  if (product.state === 'enabled' || product.state === 'unknown') {
    return null;
  }

  if (product.state === 'blocked') {
    return (
      <Panel
        title="Channels is suspended for this workspace"
        subtitle="Billing state blocks new channel accounts. Existing accounts keep their data; nothing is deleted."
      >
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          {product.status === 'past_due'
            ? 'This workspace is past due — settle billing to resume connecting channels.'
            : 'This workspace is suspended — contact support to review the suspension.'}{' '}
          Paying is how you recover; an owner or billing contact can do that under Settings → Billing.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Channels isn't enabled for this workspace"
      subtitle="One step, then you can connect WhatsApp, Messenger, Telegram, or the website widget."
    >
      <p style={{ fontSize: 13, lineHeight: 1.5, margin: '0 0 12px' }}>
        Connecting a channel needs the Channels product switched on for this workspace
        {product.status === 'expired' ? ' (its previous enablement lapsed)' : ''}. Enabling is
        free to start and billed per use afterwards.
      </p>
      {canEnable ? (
        <ActionButton
          size="sm"
          disabled={activate.isPending}
          title={activate.isPending ? 'Enabling Channels…' : 'Enable Channels for this workspace'}
          onClick={() => activate.mutate()}
        >
          {activate.isPending ? 'Enabling…' : 'Enable Channels'}
        </ActionButton>
      ) : (
        <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          Ask an owner or billing contact to enable Channels (one click, under Channels) — your
          role ({role ?? 'none'}) can view but not switch on products.
        </p>
      )}
    </Panel>
  );
}
