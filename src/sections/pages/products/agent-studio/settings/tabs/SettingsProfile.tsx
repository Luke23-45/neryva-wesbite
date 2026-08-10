import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Avatar } from '@components/common/ui/Avatar';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

export function SettingsProfile() {
  const data = settings.profile;
  const [name, setName] = useState(data.name);
  const [email, setEmail] = useState(data.email);
  const [bio, setBio] = useState(data.bio);
  const [tz, setTz] = useState(data.timezone);
  const [loc, setLoc] = useState(data.locale);

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <Panel title="Identity" subtitle="How you appear in your workspace and to your agents.">
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 18 }}>
            <Avatar initials="NV" hue="azure" size={56} status="online" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => toast.success('Avatar updated')}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 8,
                  color: '#f5f7fb',
                  fontFamily: 'inherit',
                  fontSize: 12.5,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Upload photo
              </button>
              <button
                type="button"
                onClick={() => toast('Avatar removed', { icon: '🗑️' })}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: 'rgba(229,231,235,0.7)',
                  fontFamily: 'inherit',
                  fontSize: 12.5,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            <TextInput label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            <TextInput label="Timezone" value={tz} onChange={(e) => setTz(e.target.value)} />
            <TextInput label="Locale" value={loc} onChange={(e) => setLoc(e.target.value)} />
          </div>
          <div style={{ marginTop: 14 }}>
            <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <SaveRow onSave={() => toast.success('Profile saved')} />
        </Panel>
      </motion.div>
    </>
  );
}
