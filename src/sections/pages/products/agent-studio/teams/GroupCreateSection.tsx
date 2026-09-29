import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { pageItem } from '@styles/motion';
import { useOrg } from '@/Context/OrgContext';
import { useCreateGroup } from '@hooks/engine/mutations';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import {
  InviteForm,
  InviteLabel,
  InviteInput,
} from './TeamsView.styles';

/**
 * Create a group — dedicated section replacing the group create modal (T-4).
 * Validation byte-identical: name required (trimmed).
 */
export function GroupCreateSection() {
  const { canManageMembers } = useOrg();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateGroup();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const dirty = name.trim() !== '' || description.trim() !== '';
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsaved group. Leaving now discards it.');

  useEffect(() => {
    if (!canManageMembers) {
      navigate({ to: '/agent-studio/teams' });
    }
  }, [canManageMembers, navigate]);

  if (!canManageMembers) {
    return null;
  }

  const submit = () => {
    if (!name.trim()) {
      return;
    }
    create.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Group created');
          navigate({ to: '/agent-studio/teams' });
        },
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <SectionBackRow to="/agent-studio/teams">
          <span aria-hidden="true">‹</span> Teams
        </SectionBackRow>
      </motion.div>

      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Create a group</ViewTitle>
          <ViewSubtitle>Groups bundle members for shared access.</ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel>
          <InviteForm>
            <InviteLabel>
              Group name
              <InviteInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Support agents"
                autoFocus
              />
            </InviteLabel>
            <InviteLabel>
              Description
              <InviteInput
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this group is for"
              />
            </InviteLabel>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/teams' })}>
                Cancel
              </ActionButton>
              <ActionButton disabled={!name.trim() || create.isPending} onClick={submit}>
                Create group
              </ActionButton>
            </div>
          </InviteForm>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
