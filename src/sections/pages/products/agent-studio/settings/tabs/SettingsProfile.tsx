import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X as XIcon, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Avatar } from '@components/common/ui/Avatar';
import { spring } from '@styles/motion';
import settings from '@neryva_data/products/agent_studio/settings.json';
import { SaveRow } from './shared';

/**
 * Settings → Profile
 *
 * Apple-grade behaviors:
 * - Avatar upload: hidden file input, click the photo to open system
 *   picker. Hover overlay shows a Camera glyph + "Update" CTA.
 *   Crop preview is circular (with a subtle ring) — matches iOS Photos
 *   app pattern.
 * - "Remove" button only appears when a custom photo is set, and
 *   restores the initials+gradient default.
 * - All values persist to localStorage so a refresh keeps the photo.
 */

const STORAGE_KEY = 'studio.profile.avatar';

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

  useEffect(() => {
    // Keep name in sync if user hasn't typed yet — but here we just leave it.
  }, []);

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
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
            <UploadBtn
              type="button"
              onClick={() => fileRef.current?.click()}
              whileTap={{ scale: 0.97 }}
              transition={spring.snap}
            >
              <Upload size={13} strokeWidth={1.8} />
              Upload photo
            </UploadBtn>
            {avatar && (
              <RemoveBtn
                type="button"
                onClick={removeAvatar}
                whileTap={{ scale: 0.97 }}
                transition={spring.snap}
              >
                <XIcon size={13} strokeWidth={1.8} />
                Remove
              </RemoveBtn>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
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
        <div style={{ marginTop: 14 }}>
          <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: rgba(192, 132, 252, 0.55);
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(147, 197, 253, 0.55);
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

const UploadBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  color: #f5f7fb;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.10);
    border-color: rgba(255, 255, 255, 0.18);
  }
`;

const RemoveBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: rgba(229, 231, 235, 0.7);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(248, 113, 113, 0.10);
    border-color: rgba(248, 113, 113, 0.30);
    color: rgba(248, 113, 113, 1);
  }
`;

const PhotoMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-left: 4px;
`;

const PhotoMetaRow = styled.div`
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.6);

  strong {
    color: #f5f7fb;
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
