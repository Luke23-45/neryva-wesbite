import { describe, expect, it } from 'vitest';
import {
  LOGO_DATA_URL_RE,
  LOGO_FILE_MAX_BYTES,
  buildBrandingPayload,
  isLogoDataUrl,
  resolveBrandColor,
  resolveWorkspaceLogo,
} from './workspaceBranding';

describe('LOGO_FILE_MAX_BYTES', () => {
  it('keeps the data URL under Fastify\'s 1 MB default JSON body cap', () => {
    // base64 inflates by 4/3; the PATCH body also carries the other fields.
    expect(LOGO_FILE_MAX_BYTES * (4 / 3)).toBeLessThan(1_000_000);
  });

  it('stays under the engine\'s 2_000_000-char logo_dataurl cap', () => {
    expect(LOGO_FILE_MAX_BYTES * (4 / 3)).toBeLessThan(2_000_000);
  });
});

describe('isLogoDataUrl', () => {
  it('accepts the png/jpeg/webp/svg data URLs the engine validates', () => {
    expect(isLogoDataUrl('data:image/png;base64,iVBOR')).toBe(true);
    expect(isLogoDataUrl('data:image/jpeg;base64,/9j/')).toBe(true);
    expect(isLogoDataUrl('data:image/webp;base64,UklG')).toBe(true);
    expect(isLogoDataUrl('data:image/svg+xml;base64,PHN2')).toBe(true);
  });

  it('matches the engine regex exactly (case-insensitive mime; jpg is accepted by jpe?g)', () => {
    expect('data:image/PNG;base64,xx'.match(LOGO_DATA_URL_RE)).not.toBeNull();
    expect('data:image/jpg;base64,xx'.match(LOGO_DATA_URL_RE)).not.toBeNull();
    expect('data:image/JPEG;base64,xx'.match(LOGO_DATA_URL_RE)).not.toBeNull();
  });

  it('rejects flavors the engine would 400 on save (e.g. gif)', () => {
    expect(isLogoDataUrl('data:image/gif;base64,R0lG')).toBe(false);
  });

  it('rejects non-strings and empty values', () => {
    expect(isLogoDataUrl(null)).toBe(false);
    expect(isLogoDataUrl(undefined)).toBe(false);
    expect(isLogoDataUrl('')).toBe(false);
    expect(isLogoDataUrl('not-a-data-url')).toBe(false);
  });
});

describe('resolveBrandColor', () => {
  it('returns a valid #rrggbb from branding', () => {
    expect(resolveBrandColor({ brand_color: '#0ea5e9' })).toBe('#0ea5e9');
  });

  it('returns null for the legacy `color` key the engine silently drops', () => {
    expect(resolveBrandColor({ color: '#0ea5e9' })).toBe(null);
  });

  it('returns null for malformed or missing values', () => {
    expect(resolveBrandColor({})).toBe(null);
    expect(resolveBrandColor({ brand_color: 'red' })).toBe(null);
    expect(resolveBrandColor({ brand_color: '#0ea5e' })).toBe(null);
    expect(resolveBrandColor({ brand_color: 123 })).toBe(null);
  });
});

describe('resolveWorkspaceLogo', () => {
  const png = 'data:image/png;base64,iVBOR';

  it('prefers the server copy over the legacy localStorage entry', () => {
    expect(resolveWorkspaceLogo({ logo_dataurl: png }, png + 'legacy')).toBe(png);
  });

  it('migrates a legacy localStorage entry when the server has none', () => {
    expect(resolveWorkspaceLogo({}, png)).toBe(png);
  });

  it('returns null when neither source has a valid logo', () => {
    expect(resolveWorkspaceLogo({}, null)).toBe(null);
    expect(resolveWorkspaceLogo({ logo_dataurl: 'junk' }, 'junk')).toBe(null);
    expect(resolveWorkspaceLogo({}, '')).toBe(null);
  });
});

describe('buildBrandingPayload', () => {
  it('sends brand_color and logo_dataurl together (engine merges them)', () => {
    expect(buildBrandingPayload('#0ea5e9', 'data:image/png;base64,iVBOR')).toEqual({
      brand_color: '#0ea5e9',
      logo_dataurl: 'data:image/png;base64,iVBOR',
    });
  });

  it('sends logo_dataurl: null so removing the logo clears the engine key', () => {
    expect(buildBrandingPayload('#0ea5e9', null)).toEqual({
      brand_color: '#0ea5e9',
      logo_dataurl: null,
    });
  });
});
