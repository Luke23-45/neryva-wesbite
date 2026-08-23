import { pageItem, ease } from '@styles/motion';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Slack, Mail, Webhook, Bell, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Switch } from '@components/common/ui/Switch';
import { SaveRow } from './shared';
import settings from '@neryva_data/products/deployment/settings.json';

const KIND_ICONS = {
  slack: Slack,
  pagerduty: Bell,
  email: Mail,
  webhook: Webhook,
} as const;

const KIND_LABEL = {
  slack: 'Slack',
  pagerduty: 'PagerDuty',
  email: 'Email',
  webhook: 'Webhook',
} as const;

const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ChannelCard = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.status.warning.border};
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

const ChannelIcon = styled.div<{ $kind: string }>`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $kind }) =>
    $kind === 'slack'
      ? 'rgba(74, 21, 75, 0.30)'
      : $kind === 'pagerduty'
        ? 'rgba(245, 158, 11, 0.18)'
        : $kind === 'email'
          ? 'rgba(96, 165, 250, 0.18)'
          : 'rgba(168, 85, 247, 0.18)'};
  border: 1px solid
    ${({ $kind }) =>
      $kind === 'slack'
        ? 'rgba(74, 21, 75, 0.45)'
        : $kind === 'pagerduty'
          ? 'rgba(245, 158, 11, 0.40)'
          : $kind === 'email'
            ? 'rgba(96, 165, 250, 0.40)'
            : 'rgba(168, 85, 247, 0.40)'};
  color: ${({ $kind }) =>
    $kind === 'slack'
      ? '#d8b4fe'
      : $kind === 'pagerduty'
        ? '#fbbf24'
        : $kind === 'email'
          ? '#93c5fd'
          : '#d8b4fe'};
`;

const ChannelBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChannelTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const ChannelName = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const ChannelTarget = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  word-break: break-all;
`;

const EventPills = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const EventPill = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.warning.bg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  color: ${({ theme }) => theme.app.status.warning.fg};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DeleteBtn = styled.button`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: rgba(248, 113, 113, 0.6);
  border-radius: 7px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(248, 113, 113, 0.10);
    color: ${({ theme }) => theme.app.status.error.fg};
  }
`;

export function SettingsNotifications() {
  const [channels, setChannels] = useState(settings.notifications.channels);

  const toggle = (id: string) => {
    setChannels((list) =>
      list.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const remove = (id: string) => {
    const c = channels.find((x) => x.id === id);
    setChannels((list) => list.filter((x) => x.id !== id));
    if (c) toast.error(`${c.name} removed`);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
      <Panel
        title="Notification channels"
        subtitle="Where deployment events are delivered."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <SaveRow onSave={() => toast.success('Notification settings saved')} />
          </div>
        }
      >
        <ChannelList>
          {channels.map((c, i) => {
            const Icon = KIND_ICONS[c.kind as keyof typeof KIND_ICONS];
            return (
              <ChannelCard
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: ease.premium, delay: i * 0.04 }}
              >
                <ChannelIcon $kind={c.kind}>
                  <Icon size={16} strokeWidth={1.7} />
                </ChannelIcon>
                <ChannelBody>
                  <ChannelTop>
                    <ChannelName>{c.name}</ChannelName>
                    <span
                      style={{
                        fontSize: 10.5,
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'rgba(229, 231, 235, 0.65)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {KIND_LABEL[c.kind as keyof typeof KIND_LABEL]}
                    </span>
                  </ChannelTop>
                  <ChannelTarget>{c.target}</ChannelTarget>
                  <EventPills>
                    {c.events.map((e) => (
                      <EventPill key={e}>{e}</EventPill>
                    ))}
                  </EventPills>
                </ChannelBody>
                <Actions>
                  <Switch checked={c.active} onChange={() => toggle(c.id)} />
                  <DeleteBtn
                    type="button"
                    aria-label={`Remove ${c.name}`}
                    onClick={() => remove(c.id)}
                  >
                    <Trash2 size={14} strokeWidth={1.7} />
                  </DeleteBtn>
                </Actions>
              </ChannelCard>
            );
          })}
        </ChannelList>

        <button
          type="button"
          onClick={() => toast('Channel picker coming soon', { icon: '🔔' })}
          style={{
            marginTop: 18,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: 9,
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#f5f7fb',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={13} strokeWidth={2} />
          Add channel
        </button>
      </Panel>
    </motion.div>
  );
}
