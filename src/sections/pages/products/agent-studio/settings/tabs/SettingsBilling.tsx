import { motion } from 'framer-motion';
import { Download, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import settings from '@neryva_data/products/agent_studio/settings.json';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

export function SettingsBilling() {
  const b = settings.billing;
  const msgPct = (b.messagesUsed / b.messagesLimit) * 100;
  const storagePct = (b.storageUsedGb / b.storageLimitGb) * 100;

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <Panel
          title="Current plan"
          subtitle={`Renews on ${b.renewal}`}
          action={
            <button
              type="button"
              onClick={() => toast.success('Plan switcher — coming soon')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)',
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Upgrade to Scale <ArrowUpRight size={13} strokeWidth={1.8} />
            </button>
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 500, color: '#f5f7fb' }}>{b.plan}</div>
            <div style={{ fontSize: 14, color: 'rgba(229,231,235,0.65)' }}>{b.price}</div>
            <div style={{ marginLeft: 'auto' }}>
              <StatusPill tone="success">active</StatusPill>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'rgba(229,231,235,0.85)',
                  marginBottom: 6,
                }}
              >
                <span>Messages this month</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#f5f7fb' }}>
                  {b.messagesUsed.toLocaleString()} / {b.messagesLimit.toLocaleString()}
                </span>
              </div>
              <ProgressBar value={msgPct} tone={msgPct > 85 ? 'amber' : 'azure'} />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'rgba(229,231,235,0.85)',
                  marginBottom: 6,
                }}
              >
                <span>Knowledge storage</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#f5f7fb' }}>
                  {b.storageUsedGb.toFixed(1)} GB / {b.storageLimitGb} GB
                </span>
              </div>
              <ProgressBar value={storagePct} tone="emerald" />
            </div>
          </div>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Panel title="Invoices" subtitle="Past invoices available as PDF">
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
              <div style={{ width: '34%' }}>Invoice</div>
              <div style={{ width: '34%' }}>Period</div>
              <div style={{ width: '18%', textAlign: 'right' }}>Amount</div>
              <div style={{ width: '14%' }} />
            </div>
            {b.invoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 22px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ width: '34%', fontSize: 13, color: '#f5f7fb', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {inv.id}
                </div>
                <div style={{ width: '34%', fontSize: 13, color: 'rgba(229,231,235,0.85)' }}>{inv.period}</div>
                <div style={{ width: '18%', textAlign: 'right', fontSize: 13, color: '#f5f7fb', fontVariantNumeric: 'tabular-nums' }}>
                  {inv.amount}
                </div>
                <div style={{ width: '14%', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <StatusPill tone="success" dot={false}>
                    {inv.status}
                  </StatusPill>
                  <button
                    type="button"
                    onClick={() => toast.success(`Downloading ${inv.id}.pdf`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.04)',
                      color: '#f5f7fb',
                      fontFamily: 'inherit',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={11} strokeWidth={1.8} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </motion.div>
    </>
  );
}
