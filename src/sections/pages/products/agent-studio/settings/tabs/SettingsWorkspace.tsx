import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X as XIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { spring, pageItem } from '@styles/motion';
import { useOrgProfile, useProjects } from '@hooks/engine/queries';
import { useUpdateOrgSettings } from '@hooks/engine/mutations';
import { useOrg } from '@/Context/OrgContext';
import {
  LOGO_FILE_MAX_BYTES,
  buildBrandingPayload,
  clearLegacyLogo,
  isLogoDataUrl,
  readLegacyLogo,
  resolveBrandColor,
  resolveWorkspaceLogo,
} from './workspaceBranding';
import { SaveRow } from './shared';

/**
 * Settings → Workspace (ledger T-2)
 *
 * - Every field saves through PATCH /console/org/:orgId/settings — name,
 *   region, support email, default project, retention, branding
 *   (brand_color — P7-WS-05: the engine keeps only `brand_color`, so the UI
 *   sends and reads that key; sending `color` 200s but is silently dropped).
 *   (A4-80: the "Default model" preference was removed — the engine accepted
 *   the key but nothing consumed it, so the field was write-only theater.
 *   It returns if a real consumer lands; until then the UI says so plainly.)
 * - Branding round-trips the engine's `branding` map (`logo_dataurl` +
 *   `brand_color`; P2-13: the logo is no longer localStorage-only — it syncs
 *   to org settings and rehydrates from the server. Brand color has no
 *   studio-wide consumer yet (P2-14), so the UI says so plainly instead of
 *   claiming it styles the studio.)
 * - Saves are admin-gated per the access model.
 */

const PRESETS = [
  '#c084fc', // lilac
  '#2563eb', // azure
  '#05e3a4', // emerald
  '#a855f7', // amethyst
  '#f97316', // orange
  '#ec4899', // pink
];

const LOGO_KEY = 'studio.workspace.logo';

interface OrgProfileData {
  org: { id: string; name: string; region: string | null; retentionDays: number | null };
  settings: { supportEmail: string | null; defaultProjectId: string | null; branding: Record<string, unknown>; preferences: Record<string, unknown> };
}

export function SettingsWorkspace() {
  const profile = useOrgProfile();
  return (
    <QueryView query={profile} skeleton={<Skeleton $h="420px" $r="12px" />}>
      {(data) => <WorkspaceForm key={data.org.id} data={data} />}
    </QueryView>
  );
}

function WorkspaceForm({ data }: { data: OrgProfileData }) {
  const { atLeast } = useOrg();
  const canManage = atLeast('admin');
  const projects = useProjects();
  const update = useUpdateOrgSettings();

  const branding = data.settings.branding ?? {};
  // P7-WS-05: the engine's BrandingDto keeps only `brand_color` — reading
  // `color` never rehydrates (the picker fell back to the default forever).
  // P2-14: brand color has no studio-wide consumer; the only genuine one is
  // the preview on this page, so the copy below says exactly that.
  const brandingColor = resolveBrandColor(branding);

  const [name, setName] = useState(data.org.name);
  const [region, setRegion] = useState(data.org.region ?? '');
  const [supportEmail, setSupportEmail] = useState(data.settings.supportEmail ?? '');
  const [defaultProjectId, setDefaultProjectId] = useState(data.settings.defaultProjectId ?? '');
  const [retention, setRetention] = useState(String(data.org.retentionDays ?? 30));

  // Logo: server is the source of truth (`branding.logo_dataurl`); a legacy
  // localStorage entry migrates in and is cleared from local storage on save.
  const [logo, setLogo] = useState<string | null>(() =>
    resolveWorkspaceLogo(branding, readLegacyLogo(LOGO_KEY)),
  );
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // P1-3: the custom hex field must always reflect the workspace's current
  // brand colour — same default as the swatch selection, and kept in sync
  // when a preset swatch is picked.
  const [color, setColor] = useState<string>(brandingColor ?? '#c084fc');
  const [customHex, setCustomHex] = useState<string>(brandingColor ?? '#c084fc');

  const pickPreset = (hex: string) => {
    setColor(hex);
    setCustomHex(hex);
  };

  const isCustom = !PRESETS.includes(color);

  const onFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Logo must be an image');
      return;
    }
    if (file.size > LOGO_FILE_MAX_BYTES) {
      toast.error('Logo must be under 700 KB so it fits the workspace sync');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      // The engine only accepts png/jpeg/webp/svg data URLs for
      // branding.logo_dataurl — a GIF would 400 on save otherwise.
      if (!isLogoDataUrl(result)) {
        toast.error('Logo must be a PNG, JPEG, WebP, or SVG image');
        return;
      }
      setLogo(result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    // Sending logo_dataurl: null on save deletes the engine key.
    setLogo(null);
  };

  // P2-12: "Save changes" stays disabled until something actually differs
  // from the loaded workspace — no-op saves on pristine load.
  // (Memoized: readLegacyLogo hits localStorage, so don't run it per render.)
  const initialLogo = useMemo(
    () => resolveWorkspaceLogo(branding, readLegacyLogo(LOGO_KEY)),
    // branding/data are stable for the form's lifetime (keyed by org id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const dirty =
    name !== data.org.name ||
    region !== (data.org.region ?? '') ||
    supportEmail !== (data.settings.supportEmail ?? '') ||
    defaultProjectId !== (data.settings.defaultProjectId ?? '') ||
    retention !== String(data.org.retentionDays ?? 30) ||
    logo !== initialLogo ||
    color !== (brandingColor ?? '#c084fc');

  const onDropKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileRef.current?.click();
    }
  };

  const save = () => {
    const retentionDays = Number(retention);
    if (!Number.isFinite(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
      toast.error('Retention must be between 1 and 3650 days');
      return;
    }
    // A4-80: the "Default model" preference is no longer sent — the engine
    // persisted the key but nothing consumed it, so the field was write-only
    // theater (200 + "saved" toast, value inert). Removed until a real
    // consumer exists; the UI says so plainly below.
    update.mutate(
      {
        name: name.trim(),
        region: region.trim() || undefined,
        support_email: supportEmail.trim() || undefined,
        default_project_id: defaultProjectId || undefined,
        retention_days: Math.round(retentionDays),
        // P2-13: the logo syncs to the engine's `branding.logo_dataurl`
        // (merge-on-write; null clears it). The legacy localStorage entry is
        // dead weight once the server copy exists — remove it.
        branding: buildBrandingPayload(color, logo),
      },
      {
        onSuccess: () => {
          clearLegacyLogo(LOGO_KEY);
          toast.success('Workspace settings saved');
        },
      },
    );
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
      <Panel
        title="Workspace"
        subtitle="Identity, region, and defaults for your team."
        action={
          canManage ? (
            <SaveRow inline onSave={save} disabled={update.isPending || !dirty} />
          ) : (
            <InlineNote>Admins manage workspace settings</InlineNote>
          )
        }
      >
        <BrandGrid>
          {/* ─── Logo ─── */}
          <FieldGroup>
            <FieldLabel>Logo</FieldLabel>
            <FieldHint>Synced with your workspace. PNG / JPEG / WebP / SVG, up to 700 KB. Not shown in the studio sidebar or shared embeds yet.</FieldHint>
            <DropZone
              $drag={drag}
              role="button"
              tabIndex={0}
              aria-label="Upload workspace logo"
              onKeyDown={onDropKey}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                onFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileRef.current?.click()}
              whileTap={{ scale: 0.99 }}
              transition={spring.snap}
            >
              {logo ? (
                <>
                  <LogoPreview src={logo} alt="Workspace logo preview" />
                  <LogoOverlay>
                    <Upload size={14} strokeWidth={1.8} />
                    Replace
                  </LogoOverlay>
                  <RemoveBtn
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLogo();
                    }}
                    aria-label="Remove logo"
                  >
                    <XIcon size={13} strokeWidth={1.8} />
                  </RemoveBtn>
                </>
              ) : (
                <DropEmpty>
                  <UploadBadge aria-hidden="true">
                    <Upload size={16} strokeWidth={1.7} />
                  </UploadBadge>
                  <DropTitle>Drop your logo here</DropTitle>
                  <DropHint>or click to browse — square images work best</DropHint>
                </DropEmpty>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
                aria-label="Upload logo"
              />
            </DropZone>
          </FieldGroup>

          {/* ─── Brand color ─── */}
          <FieldGroup>
            <FieldLabel>Brand color</FieldLabel>
            {/* P2-14: no studio-wide consumer exists yet — the copy claims
                only the genuine consumer (the preview below), not "the
                brand mark and accents" across the studio. */}
            <FieldHint>Stored with your workspace. Previewed below — not yet applied across the studio.</FieldHint>
            <SwatchRow>
              {PRESETS.map((hex) => (
                <SwatchBtn
                  key={hex}
                  type="button"
                  $on={color === hex}
                  aria-pressed={color === hex}
                  onClick={() => pickPreset(hex)}
                  whileTap={{ scale: 0.92 }}
                  transition={spring.snap}
                  aria-label={`Brand color ${hex}`}
                >
                  <SwatchFill $color={hex} />
                  {color === hex && (
                    <SwatchCheck layoutId="brand-color-ring" transition={spring.bouncy}>
                      <Check size={11} strokeWidth={2.4} />
                    </SwatchCheck>
                  )}
                </SwatchBtn>
              ))}
            </SwatchRow>
            <CustomHexRow>
              <HexPrefix>#</HexPrefix>
              <HexInput
                type="text"
                value={customHex.replace(/^#/, '')}
                placeholder="0ea5e9"
                maxLength={6}
                aria-label="Custom brand color hex"
                onChange={(e) => {
                  const v = e.target.value.replace(/[^a-fA-F0-9]/g, '').slice(0, 6);
                  setCustomHex(`#${v}`);
                  if (/^[a-fA-F0-9]{6}$/.test(v)) setColor(`#${v}`);
                }}
              />
              <HexPreview $color={isCustom ? customHex : color} aria-hidden="true" />
            </CustomHexRow>
            <BrandPreview>
              <PreviewMark $color={isCustom ? customHex : color} viewBox="0 0 32 32" aria-hidden="true">
                <path
                  d="M6 26V8.5C6 7.12 7.12 6 8.5 6h7.2c3.59 0 6.5 2.91 6.5 6.5S19.29 19 15.7 19H11v7H6z"
                  fill="currentColor"
                />
              </PreviewMark>
              <PreviewMeta>
                <PreviewName>{name || 'Workspace'}</PreviewName>
                <PreviewTag>Studio</PreviewTag>
              </PreviewMeta>
            </BrandPreview>
          </FieldGroup>
        </BrandGrid>

        <Divider />

        <FieldGrid>
          <TextInput
            label="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canManage}
          />
          <TextInput
            label="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            hint="us-west-2, eu-central-1, ap-southeast-1"
            disabled={!canManage}
          />
          <TextInput
            label="Support email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            type="email"
            disabled={!canManage}
          />
          <SelectField label="Default project">
            <WorkspaceSelect
              value={defaultProjectId}
              onChange={(e) => setDefaultProjectId(e.target.value)}
              aria-label="Default project"
              disabled={!canManage}
            >
              <option value="">No default project</option>
              {(projects.data?.projects ?? []).filter((p) => !p.archivedAt).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </WorkspaceSelect>
            {/* P1-8: agent creation cannot consume this — the engine's
                CreateAssistantDto rejects unknown top-level keys, so the
                copy claims only what key issuance actually does. */}
            <FieldHint>New API keys are bound to this project when issued.</FieldHint>
          </SelectField>
          <TextInput
            label="Default model"
            value=""
            onChange={() => {}}
            hint="Not configurable yet — each agent uses its own configured provider and model (see the agent's Configuration)."
            placeholder="Not configurable yet"
            disabled
          />
          <TextInput
            label="Conversation retention (days)"
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
            hint="How long transcripts are stored before automatic deletion"
            disabled={!canManage}
          />
        </FieldGrid>
      </Panel>
    </motion.div>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const BrandGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(260px, 1.2fr);
  gap: 22px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const FieldHint = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  line-height: 1.5;
  margin-bottom: 4px;
`;

const DropZone = styled(motion.div)<{ $drag: boolean }>`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 16px;
  border: 1.5px dashed
    ${({ $drag, theme }) => ($drag ? theme.app.status.lilac.fg : theme.app.border.hover)};
  background: ${({ $drag, theme }) =>
    $drag ? theme.app.status.lilac.bg : theme.app.surface.subtle};
  cursor: pointer;
  overflow: hidden;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.status.lilac.border};
    background: ${({ theme }) => theme.app.status.lilac.bg};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

const DropEmpty = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  gap: 4px;
`;

const UploadBadge = styled.span`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 2px;
`;

const DropTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
  font-weight: 500;
`;

const DropHint = styled.div`
  font-size: 10.5px;
  color: ${({ theme }) => theme.app.text.faint};
  line-height: 1.3;
`;

const LogoPreview = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LogoOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  color: #fff;
  background: rgba(11, 13, 18, 0.65);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  ${DropZone}:hover & {
    opacity: 1;
  }
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(11, 13, 18, 0.75);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.status.error.fg};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const SwatchRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SwatchBtn = styled(motion.button)<{ $on: boolean }>`
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

const SwatchFill = styled.span<{ $color: string }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.30),
    0 1px 2px rgba(0, 0, 0, 0.30);
`;

const SwatchCheck = styled(motion.span)`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.95);
  color: #fff;

  /* Drop shadow for legibility on light swatches */
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.30));
`;

const CustomHexRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 9px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.app.border.focus};
  }
`;

const HexPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.faint};
`;

const HexInput = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  text-transform: lowercase;
  padding: 0;
`;

const HexPreview = styled.span<{ $color: string }>`
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: ${({ $color }) => $color};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.20),
    0 0 0 1px rgba(255, 255, 255, 0.10);
  flex-shrink: 0;
`;

const BrandPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.20);
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
  margin-top: 4px;
`;

const PreviewMark = styled.svg<{ $color: string }>`
  width: 22px;
  height: 22px;
  color: ${({ $color }) => $color};
  filter: drop-shadow(0 1px 4px ${({ $color }) => `${$color}40`});
  flex-shrink: 0;
  transition: color ${({ theme }) => theme.transitions.standard};
`;

const PreviewMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const PreviewName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.01em;
`;

const PreviewTag = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

const Divider = styled.hr`
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  margin: 22px 0 18px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SelectFieldBox>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </SelectFieldBox>
  );
}

const SelectFieldBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const WorkspaceSelect = styled.select`
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 9px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  option {
    background: #14151c;
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const InlineNote = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.faint};
`;
