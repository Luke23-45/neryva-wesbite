import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { pageItem } from '@styles/motion';
import { ApiError } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useWebhookEvents, useWebhooks, useUpdateWebhook } from '@hooks/studio/useWebhooks';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { isValidUrl } from './webhook-section-utils';
import { EventSelector, Stack, FieldLabel, HintText, ToggleChip, StatusToggle } from './webhook-section-shared';

/**
 * Edit webhook — dedicated section replacing the "Edit webhook" modal from
 * WebhooksView.
 *
 * Copy, validation, and save semantics are verbatim from the modal:
 * destination URL must parse as http(s), at least one subscribed event,
 * an empty event list falls back to `*` on prefill, description sends
 * `null` when blanked, and the active/disabled toggle keeps its hint copy.
 * Unknown ids and the disabled-module 404 bounce back to the endpoint list.
 */
export function WebhookEditSection() {
  const { webhookId } = useParams({ from: '/agent-studio/integrations/webhooks/$webhookId/edit' });
  const navigate = useNavigate();
  const { role } = useOrg();
  // Webhook writes require owner/admin/developer (engine @Roles on the
  // write routes — setup:author matches exactly). Readers and billing
  // bounce to the list; the engine enforces regardless, this just avoids
  // a dead-end form.
  const canWrite = canSetup(role, 'setup:author');
  const webhooks = useWebhooks();
  const catalog = useWebhookEvents();
  const update = useUpdateWebhook();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'disabled'>('active');

  const target = webhooks.data?.find((w) => w.id === webhookId) ?? null;

  useEffect(() => {
    if (target) {
      setUrl(target.url);
      setDescription(target.description ?? '');
      setEvents(target.events.length > 0 ? target.events : ['*']);
      setStatus(target.status === 'disabled' ? 'disabled' : 'active');
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // J1-04 twin: a 404 on the webhooks read means the engine's webhooks
  // module is disabled in this deployment — not a failure. Unknown ids
  // bounce too; the list is the honest place for both.
  const webhooksDisabled =
    webhooks.isError && webhooks.error instanceof ApiError && webhooks.error.status === 404;
  const loaded = !webhooks.isPending;
  const unknownId = loaded && !webhooks.isError && !target;
  useEffect(() => {
    if (webhooksDisabled || unknownId) {
      navigate({ to: '/agent-studio/integrations/webhooks' });
    }
  }, [webhooksDisabled, unknownId, navigate]);

  // Permission bounce. Nothing renders before the gates.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: '/agent-studio/integrations/webhooks' });
    }
  }, [canWrite, navigate]);

  // Dirty guard: block navigation while the form differs from the loaded
  // webhook. Declared before the gate return (rules of hooks). The
  // submitted flag releases the guard on the save navigation: after a
  // committed update there is nothing unsaved, so the return to the list
  // must not trip the leave dialog.
  const [submitted, setSubmitted] = useState(false);
  const sameEvents = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
  const initialEvents = target && target.events.length > 0 ? target.events : ['*'];
  const dirty =
    !submitted &&
    !!target &&
    (url !== target.url ||
      description !== (target.description ?? '') ||
      !sameEvents(events, initialEvents) ||
      status !== (target.status === 'disabled' ? 'disabled' : 'active'));
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have unsaved webhook changes. Leaving now discards them.');

  if (!canWrite || webhooksDisabled || unknownId) {
    return null;
  }

  const listTo = { to: '/agent-studio/integrations/webhooks' as const };
  const valid = isValidUrl(url) && events.length > 0;

  const submit = () => {
    if (!valid || update.isPending || !target) {
      return;
    }
    // Commit-time disarm: the edit is handed to the engine here, so the
    // async success navigation must not trip the leave dialog. Re-armed on
    // failure so a failed update keeps protecting the draft.
    setSubmitted(true);
    update.mutate(
      {
        webhookId: target.id,
        url: url.trim(),
        events,
        description: description.trim() ? description.trim() : null,
        status,
      },
      {
        onSuccess: () => {
          toast.success('Webhook updated');
          navigate(listTo);
        },
        onError: (err) => {
          setSubmitted(false);
          toastEngineError(err, 'Could not update the webhook.');
        },
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <SectionBackRow to="/agent-studio/integrations/webhooks">
          <span aria-hidden="true">‹</span> Webhooks
        </SectionBackRow>
      </motion.div>

      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Edit webhook</ViewTitle>
          <ViewSubtitle>Update the destination, subscriptions, description, or status.</ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel title="Endpoint" subtitle="Destination, subscriptions, and delivery status.">
          {!target ? (
            <Skeleton $h="320px" $r="12px" />
          ) : (
            <Stack>
              <TextInput
                id="webhook-edit-url"
                label="Destination URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.example.com/neryva"
                autoFocus
              />
              <TextInput
                id="webhook-edit-description"
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Order events for the fulfillment service"
              />
              <EventSelector catalog={catalog.data ?? []} selected={events} onChange={setEvents} />
              <div>
                <FieldLabel>Status</FieldLabel>
                <StatusToggle>
                  <ToggleChip $active={status === 'active'} onClick={() => setStatus('active')}>Active</ToggleChip>
                  <ToggleChip $active={status === 'disabled'} onClick={() => setStatus('disabled')}>Disabled</ToggleChip>
                </StatusToggle>
                <HintText>
                  {status === 'active'
                    ? 'The webhook receives deliveries.'
                    : 'Disabled webhooks keep their history but receive nothing.'}
                </HintText>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <ActionButton variant="secondary" onClick={() => navigate(listTo)}>
                  Cancel
                </ActionButton>
                <ActionButton disabled={!valid || update.isPending} onClick={submit}>
                  Save changes
                </ActionButton>
              </div>
            </Stack>
          )}
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
