/**
 * Providers Phase 5 — Wave B: flat-color inline-style primitives shared by
 * the Tab B key cards and the custom-provider form. Apple bar, no gradients,
 * no content-modal chrome. Colors are flat dark-console neutrals with a
 * single restrained accent.
 */
import type { CSSProperties } from 'react';

export const colors = {
  bg: '#0d1117',
  surface: '#161b22',
  surface2: '#1c2330',
  border: 'rgba(255,255,255,0.09)',
  borderSoft: 'rgba(255,255,255,0.06)',
  text: '#e6edf3',
  textDim: 'rgba(230,237,243,0.72)',
  textFaint: 'rgba(230,237,243,0.45)',
  accent: '#4d9fff',
  success: '#3fb950',
  warning: '#d29922',
  error: '#f85149',
  danger: '#f85149',
} as const;

export const card: CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
  padding: 20,
};

export const cardTitle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: colors.text,
  letterSpacing: '-0.01em',
};

export const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: colors.text,
};

export const bodyText: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.6,
  color: colors.textDim,
};

export const hintText: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.55,
  color: colors.textFaint,
};

export const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

export const labelText: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: colors.textDim,
  marginBottom: 6,
  display: 'block',
};

export const errorCallout: CSSProperties = {
  background: 'rgba(248,81,73,0.08)',
  border: '1px solid rgba(248,81,73,0.35)',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#ffb4ab',
  fontSize: 13,
  lineHeight: 1.55,
};

export const noticeCallout: CSSProperties = {
  background: 'rgba(210,153,34,0.08)',
  border: '1px solid rgba(210,153,34,0.35)',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#e8c06a',
  fontSize: 13,
  lineHeight: 1.55,
};

export const okCallout: CSSProperties = {
  background: 'rgba(63,185,80,0.08)',
  border: '1px solid rgba(63,185,80,0.35)',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#9ee6a8',
  fontSize: 13,
  lineHeight: 1.55,
};

const baseBtn: CSSProperties = {
  appearance: 'none',
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  padding: '9px 16px',
  fontSize: 13.5,
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: 44,
};

export const primaryBtn: CSSProperties = {
  ...baseBtn,
  background: colors.accent,
  borderColor: colors.accent,
  color: '#fff',
};

export const secondaryBtn: CSSProperties = {
  ...baseBtn,
  background: colors.surface2,
  color: colors.text,
};

export const dangerBtn: CSSProperties = {
  ...baseBtn,
  background: 'transparent',
  borderColor: 'rgba(248,81,73,0.5)',
  color: '#ff9d94',
};

export const ghostBtn: CSSProperties = {
  ...baseBtn,
  background: 'transparent',
  border: '1px solid transparent',
  color: colors.textDim,
};

export const disabledBtn: CSSProperties = { opacity: 0.45, cursor: 'not-allowed' };

export const monogram = (size = 36): CSSProperties => ({
  width: size,
  height: size,
  borderRadius: 10,
  background: colors.surface2,
  border: `1px solid ${colors.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: Math.round(size * 0.44),
  fontWeight: 700,
  color: colors.text,
  flexShrink: 0,
  textTransform: 'uppercase',
});
