import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Plus, KeyRound, Copy as CopyIcon, RotateCw, Eye, EyeOff, MoreHorizontal, Lock } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { spring } from '@styles/motion';
import secrets from '@neryva_data/products/deployment/secrets.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  NewBtn,
  TotalsGrid,
  TotalCard,
  TotalLabel,
  TotalValue,
  TotalMeta,
  SectionTitle,
  SecretsTable,
  TableHeader,
  TableRow,
  Cell,
  SecretName,
  SecretPreview,
  KindPill,
  Meta,
} from './SecretsView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.05 },
  }),
};

const rotationTone: Record<string, 'emerald' | 'warning' | 'azure' | 'amber'> = {
  emerald: 'emerald',
  azure: 'azure',
  amber: 'amber',
  warning: 'warning',
};

const rotationLabel = (rotated: string): { label: string; tone: 'emerald' | 'warning' | 'amber' } => {
  const days = parseInt(rotated.split(' ')[0], 10);
  if (rotated.includes('minute') || rotated.includes('hour') || days <= 14) return { label: rotated, tone: 'emerald' };
  if (days <= 60) return { label: rotated, tone: 'warning' };
  return { label: rotated, tone: 'amber' };
};

export function SecretsView() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealed((r) => ({ ...r, [id]: !r[id] }));
  };

  const rotate = (name: string) => {
    toast.success(`Rotating ${name}…`);
    setTimeout(() => toast.success(`${name} rotated successfully`), 1200);
  };

  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Secrets</PageTitle>
          <PageSubtitle>
            Encrypted secrets shared across deployments. Rotate keys, audit access, and track
            rotation cadence.
          </PageSubtitle>
        </TitleBlock>
        <NewBtn type="button">
          <Plus size={14} strokeWidth={2} />
          Add secret
        </NewBtn>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <TotalsGrid>
          <TotalCard>
            <TotalLabel>Secrets</TotalLabel>
            <TotalValue>{secrets.totals.secrets}</TotalValue>
            <TotalMeta>across {secrets.totals.lastAudited} audit</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Rotated 30d</TotalLabel>
            <TotalValue style={{ color: '#34d399' }}>{secrets.totals.rotated30d}</TotalValue>
            <TotalMeta>healthy rotation</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Expiring soon</TotalLabel>
            <TotalValue style={{ color: '#fbbf24' }}>{secrets.totals.expiringSoon}</TotalValue>
            <TotalMeta>needs attention</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Last audit</TotalLabel>
            <TotalValue style={{ fontSize: 16 }}>{secrets.totals.lastAudited}</TotalValue>
            <TotalMeta>auto weekly</TotalMeta>
          </TotalCard>
        </TotalsGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <SectionTitle>
          <Lock size={14} strokeWidth={1.7} />
          Stored secrets
        </SectionTitle>
        <Panel
          title="Vault"
          subtitle="AES-256 encrypted at rest · decrypted only at request time"
          action={
            <span
              style={{
                fontSize: 11,
                color: 'rgba(229, 231, 235, 0.45)',
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <KeyRound size={11} strokeWidth={1.7} />
              {secrets.totals.secrets} total
            </span>
          }
        >
          <SecretsTable>
            <TableHeader>
              <Cell $w="32%">Name</Cell>
              <Cell $w="14%">Kind</Cell>
              <Cell $w="12%">Scope</Cell>
              <Cell $w="14%">Last rotated</Cell>
              <Cell $w="14%">Last used</Cell>
              <Cell $w="14%" />
            </TableHeader>
            {secrets.secrets.map((s, i) => {
              const rotInfo = rotationLabel(s.rotatedAt);
              return (
                <TableRow
                  key={s.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i + 3}
                >
                  <Cell $w="32%">
                    <SecretName>{s.name}</SecretName>
                    <SecretPreview>
                      {revealed[s.id] ? s.preview.replace('…', '').slice(0, 14) + '_'.repeat(8) : s.preview}
                    </SecretPreview>
                  </Cell>
                  <Cell $w="14%">
                    <KindPill>{s.kind}</KindPill>
                  </Cell>
                  <Cell $w="12%">
                    <StatusPill tone={rotationTone[s.tone] ?? 'azure'} dot={false}>
                      {s.scope}
                    </StatusPill>
                  </Cell>
                  <Cell $w="14%">
                    <Meta style={{ color: rotInfo.tone === 'amber' ? '#fbbf24' : rotInfo.tone === 'warning' ? '#fbbf24' : '#f5f7fb' }}>
                      {rotInfo.label}
                    </Meta>
                  </Cell>
                  <Cell $w="14%">
                    <Meta>{s.lastUsed}</Meta>
                  </Cell>
                  <Cell $w="14%" style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <IconBtn
                      type="button"
                      aria-label={revealed[s.id] ? 'Hide preview' : 'Reveal preview'}
                      onClick={() => toggleReveal(s.id)}
                      whileTap={{ scale: 0.92 }}
                      transition={spring.snap}
                    >
                      {revealed[s.id] ? <EyeOff size={13} strokeWidth={1.7} /> : <Eye size={13} strokeWidth={1.7} />}
                    </IconBtn>
                    <IconBtn
                      type="button"
                      aria-label={`Copy ${s.name}`}
                      onClick={() => {
                        toast.success(`${s.name} preview copied`);
                      }}
                      whileTap={{ scale: 0.92 }}
                      transition={spring.snap}
                    >
                      <CopyIcon size={13} strokeWidth={1.7} />
                    </IconBtn>
                    <IconBtn
                      type="button"
                      aria-label={`Rotate ${s.name}`}
                      onClick={() => rotate(s.name)}
                      whileTap={{ scale: 0.92 }}
                      transition={spring.snap}
                    >
                      <RotateCw size={13} strokeWidth={1.7} />
                    </IconBtn>
                    <IconBtn
                      type="button"
                      aria-label={`More actions for ${s.name}`}
                      whileTap={{ scale: 0.92 }}
                      transition={spring.snap}
                    >
                      <MoreHorizontal size={13} strokeWidth={1.7} />
                    </IconBtn>
                  </Cell>
                </TableRow>
              );
            })}
          </SecretsTable>
        </Panel>
      </motion.div>
    </PageRoot>
  );
}

const IconBtn = styled(motion.button)`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: rgba(229, 231, 235, 0.55);
  border-radius: 7px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #f5f7fb;
  }
`;
