import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { Switch } from '@components/common/ui/Switch';
import { SaveRow } from './shared';
import settings from '@neryva_data/products/deployment/settings.json';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

export function SettingsGeneral() {
  const g = settings.general;
  const [workspaceName, setWorkspaceName] = useState(g.workspaceName);
  const [region, setRegion] = useState(g.region);
  const [runtime, setRuntime] = useState(g.defaultRuntime);
  const [auditRetention, setAuditRetention] = useState(String(g.auditRetentionDays));
  const [logRetention, setLogRetention] = useState(String(g.logRetentionDays));
  const [autoRollback, setAutoRollback] = useState(g.autoRollback);
  const [canaryPct, setCanaryPct] = useState(String(g.canaryPercentage));

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
      <Panel
        title="General"
        subtitle="Workspace defaults, regions, and operational policy."
        action={<SaveRow onSave={() => toast.success('General settings saved')} />}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 14,
          }}
        >
          <TextInput
            label="Workspace name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
          />
          <TextInput
            label="Default region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            hint="us-east-1, eu-west-1, ap-southeast-1"
          />
          <TextInput
            label="Default runtime"
            value={runtime}
            onChange={(e) => setRuntime(e.target.value)}
            hint="TensorRT-LLM | vLLM | ONNX | PyTorch"
          />
          <TextInput
            label="Canary percentage"
            value={canaryPct}
            onChange={(e) => setCanaryPct(e.target.value.replace(/[^0-9]/g, ''))}
            hint="Traffic routed to new deployments before full rollout"
          />
          <TextInput
            label="Audit log retention (days)"
            value={auditRetention}
            onChange={(e) => setAuditRetention(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <TextInput
            label="Application log retention (days)"
            value={logRetention}
            onChange={(e) => setLogRetention(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>

        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#f5f7fb' }}>
              Automatic rollback on error spike
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(229, 231, 235, 0.55)', marginTop: 4, lineHeight: 1.5 }}>
              If a deployment's error rate exceeds the threshold during rollout, automatically revert
              to the previous stable version.
            </div>
          </div>
          <Switch checked={autoRollback} onChange={setAutoRollback} />
        </div>
      </Panel>
    </motion.div>
  );
}
