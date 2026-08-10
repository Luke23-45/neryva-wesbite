import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { Avatar } from '@components/common/ui/Avatar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { TextInput } from '@components/common/ui/TextInput';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

const hueCycle: Array<'azure' | 'emerald' | 'lilac' | 'amethyst'> = ['azure', 'emerald', 'lilac', 'amethyst'];
const roleHue: Record<string, 'azure' | 'emerald' | 'lilac' | 'amethyst'> = {
  Owner: 'amethyst',
  Admin: 'azure',
  Editor: 'emerald',
  Viewer: 'lilac',
};

export function SettingsTeam() {
  const [email, setEmail] = useState('');

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <Panel
          title="Members"
          subtitle="People with access to this workspace."
          action={
            <SaveRow onSave={() => toast.success('Invite sent')} saveLabel="Invite" />
          }
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <TextInput
              placeholder="email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (!email) {
                  toast.error('Enter an email to invite');
                  return;
                }
                toast.success(`Invite sent to ${email}`);
                setEmail('');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                border: 0,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                color: '#f5f7fb',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={13} strokeWidth={1.8} />
              Send invite
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -22px -22px' }}>
            <div
              style={{
                display: 'flex',
                padding: '10px 22px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(229,231,235,0.5)',
              }}
            >
              <div style={{ width: '34%' }}>Member</div>
              <div style={{ width: '24%' }}>Role</div>
              <div style={{ width: '16%' }}>Status</div>
              <div style={{ width: '18%' }}>Last active</div>
              <div style={{ width: '44px' }} />
            </div>
            {settings.team.map((m, i) => {
              const initials = m.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('');
              const hue = roleHue[m.role] ?? hueCycle[i % hueCycle.length];
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 22px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ width: '34%', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar
                      initials={initials}
                      hue={hue}
                      size={32}
                      status={m.status === 'active' ? 'online' : 'idle'}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: '#f5f7fb', fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(229,231,235,0.55)' }}>{m.email}</div>
                    </div>
                  </div>
                  <div style={{ width: '24%' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        fontSize: 11.5,
                        color: 'rgba(229,231,235,0.85)',
                      }}
                    >
                      {m.role}
                    </span>
                  </div>
                  <div style={{ width: '16%' }}>
                    <StatusPill tone={m.status === 'active' ? 'success' : 'warning'} dot>
                      {m.status}
                    </StatusPill>
                  </div>
                  <div style={{ width: '18%', fontSize: 12.5, color: 'rgba(229,231,235,0.65)' }}>
                    {m.lastActive}
                  </div>
                  <div style={{ width: '44px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => toast(`Manage ${m.name}`, { icon: '⚙️' })}
                      style={{
                        width: 28,
                        height: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 0,
                        background: 'transparent',
                        color: 'rgba(229,231,235,0.55)',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <MoreHorizontal size={15} strokeWidth={1.7} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </motion.div>
    </>
  );
}
