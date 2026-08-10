import { useState } from 'react';
import { motion } from 'framer-motion';
import { Laptop2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { Switch } from '@components/common/ui/Switch';
import { TextInput } from '@components/common/ui/TextInput';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

export function SettingsSecurity() {
  const s = settings.security;
  const [twoFa, setTwoFa] = useState(s.twoFactor);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <Panel title="Authentication" subtitle="Password and two-factor settings for your account.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
            <TextInput label="Current password" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
            <TextInput label="New password" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
            <TextInput label="Confirm new password" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13.5, color: '#f5f7fb', fontWeight: 500 }}>Two-factor authentication</div>
              <div style={{ fontSize: 12.5, color: 'rgba(229,231,235,0.55)', marginTop: 2 }}>
                Require a second factor on every sign-in.
              </div>
            </div>
            <Switch checked={twoFa} onChange={setTwoFa} />
          </div>
          <SaveRow
            onSave={() => {
              if (newPwd && newPwd !== confirmPwd) {
                toast.error('Passwords do not match');
                return;
              }
              toast.success('Security settings saved');
            }}
          />
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Panel title="Active sessions" subtitle="Where you are currently signed in.">
          <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -22px -22px' }}>
            {s.sessions.map((sess) => {
              const isMobile = /iphone|android|mobile/i.test(sess.device);
              return (
                <div
                  key={sess.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 22px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(229,231,235,0.7)',
                    }}
                  >
                    {isMobile ? <Smartphone size={15} strokeWidth={1.7} /> : <Laptop2 size={15} strokeWidth={1.7} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: '#f5f7fb', fontWeight: 500 }}>
                      {sess.device}{' '}
                      {sess.current && (
                        <span
                          style={{
                            marginLeft: 6,
                            padding: '2px 6px',
                            borderRadius: 5,
                            background: 'rgba(52, 211, 153, 0.10)',
                            border: '1px solid rgba(52, 211, 153, 0.30)',
                            color: '#34d399',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10.5,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}
                        >
                          this device
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(229,231,235,0.55)', marginTop: 2 }}>
                      {sess.location} · {sess.lastActive}
                    </div>
                  </div>
                  {!sess.current && (
                    <button
                      type="button"
                      onClick={() => toast.success('Session revoked')}
                      style={{
                        padding: '5px 10px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6,
                        background: 'transparent',
                        color: 'rgba(229,231,235,0.78)',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <Panel title="Audit log" subtitle="Recent security and configuration events.">
          <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -22px -22px' }}>
            {s.auditLog.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 22px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(229,231,235,0.5)', width: 80 }}>
                  {a.time}
                </span>
                <div style={{ flex: 1, fontSize: 13, color: '#f5f7fb' }}>{a.event}</div>
                <span style={{ fontSize: 12, color: 'rgba(229,231,235,0.55)' }}>{a.actor}</span>
              </div>
            ))}
          </div>
        </Panel>
      </motion.div>
    </>
  );
}
