import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

export function SettingsWorkspace() {
  const w = settings.workspace;
  const [name, setName] = useState(w.name);
  const [region, setRegion] = useState(w.region);
  const [supportEmail, setSupportEmail] = useState(w.supportEmail);
  const [defaultModel, setDefaultModel] = useState(w.defaultModel);
  const [retention, setRetention] = useState(String(w.retentionDays));

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
      <Panel title="Workspace" subtitle="Identity, region, and defaults for your team.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <TextInput label="Workspace name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextInput
            label="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            hint="us-west-2, eu-central-1, ap-southeast-1"
          />
          <TextInput
            label="Support email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            type="email"
          />
          <TextInput
            label="Default model"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            hint="reasoner | instant | researcher"
          />
          <TextInput
            label="Conversation retention (days)"
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
            hint="How long transcripts are stored before automatic deletion"
          />
        </div>
        <SaveRow onSave={() => toast.success('Workspace settings saved')} />
      </Panel>
    </motion.div>
  );
}
