import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X as XIcon, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Avatar } from '@components/common/ui/Avatar';
import { spring, pageItem } from '@styles/motion';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

/**
 * Settings → Profile
 *
 * - Avatar upload: hidden file input; click the photo to open the system
 *   picker. Hover overlay shows a Camera glyph + "Update" CTA.
 * - "Remove" only appears when a custom photo is set, restoring the
 *   initials+gradient default.
 * - Values persist to localStorage so a refresh keeps the photo.
 */

const STORAGE_KEY = 'studio.profile.avatar';

export function SettingsProfile() {
  const data = settings.profile;
  const [name, setName] = useState(data.name);
  const [email, setEmail] = useState(data.email);
  const [bio, setBio] = useState(data.bio);
  const [tz, setTz] = useState(data.timezone);
  const [loc, setLoc] = useState(data.locale);

  const [avatar, setAvatar] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const onPick = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Avatar must be an image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setAvatar(result);
        try {
          localStorage.setItem(STORAGE_KEY, result);
        } catch {
          /* quota */
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatar(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  // Keyboard a11y — Enter / Space opens the picker when the avatar is focused.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileRef.current?.click();
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
      <Panel title="Identity" subtitle="How you appear in your workspace and to your agents.">
        <IdentityRow>
          <PhotoSlot
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={onKey}
            whileTap={{ scale: 0.97 }}
            transition={spring.snap}
            aria-label="Upload profile photo"
          >
            <Avatar initials={initials || 'NV'} hue="azure" size={64} status="online" src={avatar ?? undefined} />
            <PhotoOverlay>
              <Camera size={14} strokeWidth={1.7} />
              Update
            </PhotoOverlay>
          </PhotoSlot>
          <PhotoActions>
            <ActionButton variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload size={13} strokeWidth={1.8} />
              Upload photo
            </ActionButton>
            {avatar && (
              <ActionButton variant="danger" size="sm" onClick={removeAvatar}>
                <XIcon size={13} strokeWidth={1.8} />
                Remove
              </ActionButton>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onPick(e.target.files?.[0])}
              aria-label="Profile photo file"
            />
            <PhotoMeta>
              <PhotoMetaRow><strong>{name || 'Your name'}</strong></PhotoMetaRow>
              <PhotoMetaRow>{email || 'email@example.com'}</PhotoMetaRow>
            </PhotoMeta>
          </PhotoActions>
        </IdentityRow>

        <FieldGrid>
          <TextInput label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <TextInput label="Timezone" value={tz} onChange={(e) => setTz(e.target.value)} />
          <TextInput label="Locale" value={loc} onChange={(e) => setLoc(e.target.value)} />
        </FieldGrid>
        <BioRow>
          <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        </BioRow>
        <SaveRow onSave={() => toast.success('Profile saved')} />
      </Panel>
    </motion.div>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const IdentityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;

const PhotoSlot = styled(motion.div)`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.status.lilac.border};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.app.border.focus};
    box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.32);
  }
`;

const PhotoOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 10.5px;
  font-weight: 500;
  color: #fff;
  background: rgba(11, 13, 18, 0.65);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  ${PhotoSlot}:hover &,
  ${PhotoSlot}:focus-visible & {
    opacity: 1;
  }
`;

const PhotoActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const PhotoMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-left: 4px;
`;

const PhotoMetaRow = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};

  strong {
    color: ${({ theme }) => theme.app.text.primary};
    font-weight: 500;
  }
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const BioRow = styled.div`
  margin-top: 14px;
`;
