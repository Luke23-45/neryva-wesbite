import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { LinkAction } from '@components/common/ui/LinkAction';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ErrorState } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { useModelAvailability } from '@hooks/studio/useSetupModels';
import { useChannels } from '@hooks/studio/useSetupChannels';
import { useApprovals } from '@hooks/studio/useSetupApprovals';
import { ApiError } from '@lib/engine/client';
import {
  OnboardList,
  OnboardRow,
  OnboardCheck,
  OnboardLabel,
  OnboardProgress,
} from './DashboardView.styles';

/**
 * Setup funnel entry (customer-setup-review.md G7) — the goal-oriented
 * checklist Company A needs on day one, computed from live setup reads
 * (no new endpoints):
 *
 * agents → knowledge → usable models → published version → serving
 * channel (+ approvals attention when the queue is non-empty).
 * Hidden once complete. The generic server onboarding checklist stays
 * untouched above; this one is setup-plane specific.
 */

interface ChecklistRow {
  id: string;
  label: string;
  done: boolean;
  href: string;
  note?: string;
}

export function SetupChecklist() {
  const assistants = useAssistants();
  const documents = useDocuments();
  const models = useModelAvailability();
  const channels = useChannels();
  const approvals = useApprovals('PENDING');

  const loading =
    assistants.isPending || documents.isPending || models.isPending || channels.isPending || approvals.isPending;

  if (loading) {
    return <Skeleton $h="180px" $r="12px" />;
  }

  // D1-08: a failed setup read is a panel-level error, never an undone step.
  // Falling through to `?? []` rows on failure lied about the world's state
  // ("Model catalog unpublished — publishing waits on staff-plane entries" on
  // a transient 500). One honest error + retry-all instead.
  // J1-03: a 404 on the channels read means the channels module is disabled
  // in this deployment (engine default) — not a failure. The step is hidden
  // instead of failing the panel; retrying a disabled module is pointless.
  const channelsDisabled =
    channels.isError && channels.error instanceof ApiError && channels.error.status === 404;
  const failed = [assistants, documents, models, approvals, ...(channelsDisabled ? [] : [channels])].find(
    (q) => q.isError,
  );
  if (failed) {
    const retryAll = () => {
      void assistants.refetch();
      void documents.refetch();
      void models.refetch();
      void channels.refetch();
      void approvals.refetch();
    };
    return (
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Setup progress"
          subtitle="From zero to serving customers — each step links its surface"
          flush
        >
          <ErrorState
            message={failed.error instanceof Error ? failed.error.message : 'Could not load setup state.'}
            onRetry={retryAll}
          />
        </Panel>
      </motion.div>
    );
  }

  const hasAgents = (assistants.data ?? []).length > 0;
  const hasReadyDocs = (documents.data ?? []).some((doc) => doc.state === 'ready');
  const usableModels = (models.data ?? []).filter((model) => model.usable).length;
  const catalogEmpty = (models.data ?? []).length === 0;
  const hasPublished = (assistants.data ?? []).some((assistant) => assistant.activeVersionId !== null);
  const hasChannels = (channels.data ?? []).length > 0;
  const pendingApprovals = (approvals.data ?? []).filter((item) => item.state === 'PENDING' && !item.expired).length;

  const rows: ChecklistRow[] = [
    {
      id: 'agents',
      label: hasAgents ? 'Agents created' : 'Create your first agent (or install a template)',
      done: hasAgents,
      href: '/agent-studio/templates',
    },
    {
      id: 'knowledge',
      label: hasReadyDocs ? 'Knowledge ready' : 'Teach it: upload documents or connect a source',
      done: hasReadyDocs,
      href: '/agent-studio/knowledge',
    },
    {
      id: 'models',
      label: catalogEmpty
        ? 'Model catalog unpublished — publishing waits on staff-plane entries'
        : usableModels > 0
          ? `${usableModels} usable model${usableModels === 1 ? '' : 's'}`
          : 'No usable models — add credentials or enable providers',
      done: usableModels > 0,
      href: '/agent-studio/models',
      note: catalogEmpty ? 'Contact support if this persists — makers cannot ship without a published catalog.' : undefined,
    },
    {
      id: 'publish',
      label: hasPublished ? 'A version is live' : 'Test, evaluate, then publish',
      done: hasPublished,
      href: '/agent-studio/agents',
    },
    // J1-03: hidden when the channels module is disabled (404) — the step
    // cannot be completed, so showing it as "not done" would be dishonest.
    ...(!channelsDisabled
      ? [
          {
            id: 'channels',
            label: hasChannels ? 'Serving on channels' : 'Connect a channel so customers can reach it',
            done: hasChannels,
            href: '/agent-studio/channels',
          } as ChecklistRow,
        ]
      : []),
  ];

  const left = rows.filter((row) => !row.done);
  if (left.length === 0 && pendingApprovals === 0) {
    return null;
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
      <Panel
        title="Setup progress"
        subtitle="From zero to serving customers — each step links its surface"
        action={<OnboardProgress>{rows.length - left.length} of {rows.length} done</OnboardProgress>}
        flush
      >
        <OnboardList>
          {rows.map((row) => (
            <OnboardRow key={row.id}>
              <OnboardCheck $done={row.done} aria-hidden="true">
                {row.done ? <CheckCircle2 size={16} strokeWidth={1.7} /> : <Circle size={16} strokeWidth={1.7} />}
              </OnboardCheck>
              <OnboardLabel $done={row.done}>
                {row.label}
                {row.note && !row.done ? ` — ${row.note}` : ''}
              </OnboardLabel>
              {!row.done && <LinkAction to={row.href}>Set up</LinkAction>}
            </OnboardRow>
          ))}
          {pendingApprovals > 0 && (
            <OnboardRow key="approvals">
              <OnboardCheck $done={false} aria-hidden="true">
                <Circle size={16} strokeWidth={1.7} />
              </OnboardCheck>
              <OnboardLabel $done={false}>
                {pendingApprovals} approval{pendingApprovals === 1 ? '' : 's'} waiting for review
              </OnboardLabel>
              <Link to="/agent-studio/approvals">Review</Link>
            </OnboardRow>
          )}
        </OnboardList>
      </Panel>
    </motion.div>
  );
}
