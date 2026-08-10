import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X as XIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { spring } from '@styles/motion';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

/**
 * Settings → Workspace
 *
 * Apple-grade behaviors:
 * - Logo upload: hidden <input type="file">, drag-over state with
 *   accent ring, live preview. Hover the drop zone shows a tinted
 *   overlay with an "Upload" CTA.
 * - Brand color: 6 preset swatches + custom hex input. Selected swatch
 *   gets an iOS-style check ring (using `layoutId` so the ring glides
 *   between swatches when you click).
 * - Live preview chip showing the brand mark + name — uses the chosen
 *   color in its gradient. Clicking "Save" commits.
 * - The form fields use the existing TextInput (with hint, focus ring).
 */

const PRESETS = [
  '#c084fc', // lilac
  '#2563eb', // azure
  '#05e3a4', // emerald
  '#a855f7', // amethyst
  '#f97316', // orange
  '#ec4899', // pink
];

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

  const [logo, setLogo] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [color, setColor] = useState<string>('#c084fc');
  const [customHex, setCustomHex] = useState<string>('#0ea5e9');

  const isCustom = !PRESETS.includes(color);

  const onFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Logo must be an image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setLogo(result);
      try {
        localStorage.setItem('studio.workspace.logo', result ?? '');
      } catch {
        /* localStorage quota — ignore for the demo */
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo(null);
    try {
      localStorage.removeItem('studio.workspace.logo');
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
      <Panel
        title="Workspace"
        subtitle="Identity, region, and defaults for your team."
        action={<SaveRow onSave={() => toast.success('Workspace settings saved')} />}
      >
        <BrandGrid>
          {/* ─── Logo ─── */}
          <FieldGroup>
            <FieldLabel>Logo</FieldLabel>
            <FieldHint>Shown in the studio sidebar and shared embeds. PNG / SVG / WebP, up to 2 MB.</FieldHint>
            <DropZone
              $drag={drag}
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
                style={{ display: 'none' }}
                onChange={(e) => onFile(e.target.files?.[0])}
                aria-label="Upload logo"
              />
            </DropZone>
          </FieldGroup>

          {/* ─── Brand color ─── */}
          <FieldGroup>
            <FieldLabel>Brand color</FieldLabel>
            <FieldHint>Used for the gradient on the brand mark and accents.</FieldHint>
            <SwatchRow>
              {PRESETS.map((hex) => (
                <SwatchBtn
                  key={hex}
                  type="button"
                  $on={color === hex}
                  onClick={() => setColor(hex)}
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
                value={isCustom ? customHex.replace(/^#/, '') : customHex.replace(/^#/, '')}
                placeholder="0ea5e9"
                maxLength={6}
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
          />
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
  font-size: 12px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.85);
`;

const FieldHint = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.5);
  line-height: 1.5;
  margin-bottom: 4px;
`;

const DropZone = styled(motion.div)<{ $drag: boolean }>`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 16px;
  border: 1.5px dashed
    ${({ $drag }) => ($drag ? 'rgba(192, 132, 252, 0.65)' : 'rgba(255, 255, 255, 0.12)')};
  background: ${({ $drag }) =>
    $drag
      ? 'rgba(192, 132, 252, 0.08)'
      : 'rgba(255, 255, 255, 0.02)'};
  cursor: pointer;
  overflow: hidden;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: rgba(192, 132, 252, 0.45);
    background: rgba(192, 132, 252, 0.04);
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
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(229, 231, 235, 0.78);
  margin-bottom: 2px;
`;

const DropTitle = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.78);
  font-weight: 500;
`;

const DropHint = styled.div`
  font-size: 10.5px;
  color: rgba(229, 231, 235, 0.45);
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
  font-size: 11.5px;
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
    background: rgba(248, 113, 113, 0.85);
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
    outline: none;
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
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: rgba(192, 132, 252, 0.45);
  }
`;

const HexPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  color: rgba(229, 231, 235, 0.45);
`;

const HexInput = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  color: #f5f7fb;
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
  border: 1px solid rgba(255, 255, 255, 0.05);
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
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.01em;
`;

const PreviewTag = styled.span`
  font-size: 11px;
  color: rgba(229, 231, 235, 0.55);
`;

const Divider = styled.hr`
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
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
