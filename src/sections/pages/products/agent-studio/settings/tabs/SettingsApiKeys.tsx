import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { CopyButton } from '@components/common/ui/CopyButton';
import settings from '@neryva_data/products/agent_studio/settings.json';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

export function SettingsApiKeys() {
  const keys = settings.apiKeys;

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
      <Panel
        title="API keys"
        subtitle="Programmatic access to your workspace. Keep these secret."
        action={
          <button
            type="button"
            onClick={() => toast.success('New key created — copy it now')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              border: 0,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)',
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} strokeWidth={1.8} />
            New key
          </button>
        }
      >
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
            <div style={{ width: '30%' }}>Name</div>
            <div style={{ width: '28%' }}>Key</div>
            <div style={{ width: '18%' }}>Created</div>
            <div style={{ width: '18%' }}>Last used</div>
            <div style={{ width: '60px' }} />
          </div>
          {keys.map((k) => (
            <div
              key={k.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 22px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ width: '30%', fontSize: 13.5, color: '#f5f7fb', fontWeight: 500 }}>{k.name}</div>
              <div style={{ width: '28%', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: 'rgba(229,231,235,0.78)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {k.prefix}
                </span>
                <CopyButton value={`${k.prefix}_rest_of_key`} label="Copy" />
              </div>
              <div style={{ width: '18%', fontSize: 12.5, color: 'rgba(229,231,235,0.65)' }}>{k.created}</div>
              <div style={{ width: '18%', fontSize: 12.5, color: 'rgba(229,231,235,0.65)' }}>{k.lastUsed}</div>
              <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => toast.error(`Revoked ${k.name}`)}
                  aria-label={`Revoke ${k.name}`}
                  style={{
                    width: 28,
                    height: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 0,
                    background: 'transparent',
                    color: 'rgba(248,113,113,0.7)',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} strokeWidth={1.7} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </motion.div>
  );
}
