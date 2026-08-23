import { pageItem, ease } from '@styles/motion';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Switch } from '@components/common/ui/Switch';
import { SaveRow } from './shared';
import settings from '@neryva_data/products/deployment/settings.json';

const EnvGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const EnvCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

const EnvTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const EnvName = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EnvMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

const EnvGrid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const MetaCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.20);
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

const MetaLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

const MetaValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
`;

export function SettingsEnvironments() {
  const [envs, setEnvs] = useState(settings.environments);

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
      <Panel
        title="Environments"
        subtitle="Where deployments can land — promotion paths and approval policy."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <SaveRow onSave={() => toast.success('Environment settings saved')} />
          </div>
        }
      >
        <EnvGrid>
          {envs.map((env, i) => (
            <EnvCard
              key={env.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: ease.premium, delay: i * 0.05 }}
            >
              <EnvTop>
                <EnvName>
                  <Server size={13} strokeWidth={1.7} />
                  {env.name}
                </EnvName>
                <StatusPill tone={env.status === 'active' ? 'success' : 'warning'}>
                  {env.status}
                </StatusPill>
              </EnvTop>
              <EnvMeta>
                <MapPin size={11} strokeWidth={1.7} />
                {env.region}
              </EnvMeta>
              <EnvGrid2>
                <MetaCell>
                  <MetaLabel>Replicas</MetaLabel>
                  <MetaValue>{env.replicas}</MetaValue>
                </MetaCell>
                <MetaCell>
                  <MetaLabel>Approval</MetaLabel>
                  <MetaValue>{env.approval}</MetaValue>
                </MetaCell>
              </EnvGrid2>
              <ToggleRow>
                Auto-promote after canary
                <Switch
                  checked={env.autoPromote}
                  onChange={(v) => {
                    setEnvs((list) =>
                      list.map((e) => (e.id === env.id ? { ...e, autoPromote: v } : e))
                    );
                    toast.success(`${env.name} auto-promote: ${v ? 'on' : 'off'}`);
                  }}
                />
              </ToggleRow>
            </EnvCard>
          ))}
        </EnvGrid>

        <button
          type="button"
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
          Add environment
        </button>
      </Panel>
    </motion.div>
  );
}
