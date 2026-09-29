import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { CopyButton } from '@components/common/ui/CopyButton';
import { Modal } from '@components/common/ui/Modal';
import { pageItem } from '@styles/motion';
import { ApiError } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useWebhookEvents, useWebhooks, useCreateWebhook } from '@hooks/studio/useWebhooks';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { isValidUrl } from './webhook-section-utils';
import { EventSelector, Stack, RotateNote, SecretBox } from './webhook-section-shared';

// sessionStorage marker for a shown-once secret whose reveal was interrupted
// by a refresh. The secret itself stays memory-only — the marker only records
// the created webhook id so the UI can say "already revealed" honestly
// instead of pretending the secret is still available.
const PENDING_REVEAL_KEY = 'neryva:webhook-pending-secret-reveal';

function readPendingReveal(): string | null {
  try {
    return sessionStorage.getItem(PENDING_REVEAL_KEY);
  } catch {
    return null;
  }
}

/**
 * New webhook — dedicated section replacing the "New webhook" modal from
 * WebhooksView.
 *
 * Copy, validation, and the reveal-once contract are verbatim from the
 * modal: destination URL must parse as http(s), at least one subscribed
 * event, one idempotency key per create-intent (double-submits replay the
 * stored response instead of minting a second webhook), and the signing
 * secret is revealed exactly once via the allowed one-time-secret modal.
 * The secret itself is memory-only; a sessionStorage marker makes a
 * refresh-during-reveal honest ("already revealed — rotate for a new one")
 * instead of silently losing it.
 * A route mount is fresh by construction, so the key is minted once here.
 */
export function WebhookNewSection() {
  const navigate = useNavigate();
  const { role } = useOrg();
  // Webhook writes require owner/admin/developer (engine @Roles on the
  // write routes — setup:author matches exactly). Readers and billing
  // bounce to the list; the engine enforces regardless, this just avoids
  // a dead-end form.
  const canWrite = canSetup(role, 'setup:author');
  const webhooks = useWebhooks();
  const catalog = useWebhookEvents();
  const create = useCreateWebhook();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState<string[]>(['*']);
  // One-time secret reveal (alert-class modal, memory-only). Set on
  // create-success; cleared when the modal closes, which navigates away.
  const [secret, setSecret] = useState<string | null>(null);
  // Refresh-during-reveal: the secret is gone (memory-only) but the marker
  // survives, so we show "already revealed" instead of an empty form.
  const [interruptedRevealId, setInterruptedRevealId] = useState<string | null>(() => readPendingReveal());
  // One idempotency key per create-intent. A failed submit keeps the key:
  // the engine never caches failures, so a retry is safe and a lost
  // response replays instead of duplicating.
  const [idemKey] = useState<string>(() => crypto.randomUUID());

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // J1-04 twin: a 404 on the webhooks read means the engine's webhooks
  // module is disabled in this deployment — not a failure. The honest
  // state lives on the list; creation is withheld since issuing would
  // 404 too.
  const webhooksDisabled =
    webhooks.isError && webhooks.error instanceof ApiError && webhooks.error.status === 404;
  useEffect(() => {
    if (webhooksDisabled) {
      navigate({ to: '/agent-studio/integrations/webhooks' });
    }
  }, [webhooksDisabled, navigate]);

  // Permission bounce. Nothing renders before the gates.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: '/agent-studio/integrations/webhooks' });
    }
  }, [canWrite, navigate]);

  // Dirty guard: block navigation while the form holds unsent content.
  // Declared before the gate return (rules of hooks) — the dialog only
  // renders with the form below. The submitted flag releases the guard on
  // the success navigation: the webhook is created, so leaving must not
  // trip the leave dialog.
  const [submitted, setSubmitted] = useState(false);
  const eventsTouched = !(events.length === 1 && events[0] === '*');
  const dirty = !submitted && (url.trim() !== '' || description.trim() !== '' || eventsTouched);
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent webhook. Leaving now discards it.');

  if (!canWrite || webhooksDisabled) {
    return null;
  }

  const listTo = { to: '/agent-studio/integrations/webhooks' as const };
  const valid = isValidUrl(url) && events.length > 0;

  const closeSecretAndExit = () => {
    try {
      sessionStorage.removeItem(PENDING_REVEAL_KEY);
    } catch {
      // Storage blocked — the in-memory reveal already happened.
    }
    setSecret(null);
    navigate(listTo);
  };

  const dismissInterruptedReveal = () => {
    try {
      sessionStorage.removeItem(PENDING_REVEAL_KEY);
    } catch {
      // Storage blocked — nothing to clear.
    }
    setInterruptedRevealId(null);
  };

  const submit = () => {
    // Commit-time disarm: the webhook is handed to the engine here, so the
    // async success path (secret reveal or list navigation) must not trip
    // the leave dialog. Re-armed on failure so a failed create keeps
    // protecting the draft.
    setSubmitted(true);
    create.mutate(
      { url: url.trim(), events, description: description.trim() || undefined, idempotencyKey: idemKey },
      {
        onSuccess: (result) => {
          if (result.secret) {
            // Alert-class one-time-secret reveal (memory-only, shown
            // exactly once). The marker makes a refresh-during-reveal
            // honest: the secret can't come back, but the UI won't pretend
            // the create never happened. Closing the reveal returns to the
            // endpoint list.
            try {
              sessionStorage.setItem(PENDING_REVEAL_KEY, result.id);
            } catch {
              // Storage blocked — the in-memory secret still renders once.
            }
            setSecret(result.secret);
          } else {
            toast.success('Webhook created');
            navigate(listTo);
          }
        },
        onError: (err) => {
          setSubmitted(false);
          toastEngineError(err, 'Could not create the webhook.');
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
          <ViewTitle ref={headingRef} tabIndex={-1}>
            New webhook
          </ViewTitle>
          <ViewSubtitle>Send signed agent events to your own HTTP endpoint.</ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      {interruptedRevealId && !secret ? (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
          <Panel
            title="Secret already revealed"
            subtitle="A signing secret was issued for the webhook just created, but the reveal was interrupted (the page was reloaded). The secret was shown exactly once and can't be displayed again."
          >
            <Stack>
              <RotateNote>
                To get a usable secret, open the webhook and rotate its signing secret — the new value is revealed once.
              </RotateNote>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <ActionButton variant="secondary" onClick={dismissInterruptedReveal}>
                  Dismiss
                </ActionButton>
                <ActionButton
                  onClick={() =>
                    navigate({
                      to: '/agent-studio/integrations/webhooks/$webhookId/edit',
                      params: { webhookId: interruptedRevealId },
                    })
                  }
                >
                  Open webhook
                </ActionButton>
              </div>
            </Stack>
          </Panel>
        </motion.div>
      ) : (
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel
          title="Endpoint"
          subtitle="Destination, optional description, and the events this endpoint receives."
        >
          <Stack>
            <TextInput
              id="webhook-url"
              label="Destination URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.example.com/neryva"
              hint="The engine validates the host server-side and blocks private/internal targets. HTTPS is required in production; HTTP is accepted in local dev only."
              autoFocus
            />
            <TextInput
              id="webhook-description"
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Order events for the fulfillment service"
            />
            <EventSelector catalog={catalog.data ?? []} selected={events} onChange={setEvents} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <ActionButton variant="secondary" onClick={() => navigate(listTo)}>
                Cancel
              </ActionButton>
              <ActionButton disabled={!valid || create.isPending} onClick={submit}>
                Create webhook
              </ActionButton>
            </div>
          </Stack>
        </Panel>
      </motion.div>
      )}

      <Modal
        open={!!secret}
        onClose={closeSecretAndExit}
        title="Webhook created"
        width={520}
        footer={<ActionButton onClick={closeSecretAndExit}>I&apos;ve saved the secret — done</ActionButton>}
      >
        <Stack>
          <RotateNote>
            Copy the signing secret now — it is shown exactly once and can
            never be retrieved again. Use it to verify the{' '}
            <code>HMAC-SHA256</code> signature on every delivery.
          </RotateNote>
          <SecretBox>
            <code>{secret}</code>
            <CopyButton value={secret ?? ''} label="Copy secret" />
          </SecretBox>
        </Stack>
      </Modal>
    </ViewShell>
  );
}
