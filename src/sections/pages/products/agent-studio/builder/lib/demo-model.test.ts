import { describe, expect, it } from 'vitest';
import {
  DEMO_DISPLAY_NAME,
  DEMO_GROUP_LABEL,
  DEMO_MODEL_ID,
  DEMO_MODEL_REF,
  DEMO_PROVIDER_ID,
  DEMO_QUOTA_PRODUCT,
  DEMO_TRY_BANNER,
  isDemoModelRef,
  isDemoProvider,
  isDemoQuotaProduct,
  quotaProductFromDetails,
} from './demo-model';

describe('demo-model pinned contract', () => {
  it('pins the exact render copy', () => {
    expect(DEMO_PROVIDER_ID).toBe('mock');
    expect(DEMO_MODEL_ID).toBe('neryva/demo');
    expect(DEMO_MODEL_REF).toBe('mock/neryva/demo');
    expect(DEMO_QUOTA_PRODUCT).toBe('agent_studio_demo');
    expect(DEMO_DISPLAY_NAME).toBe('Free demo — mock responses, not AI');
    expect(DEMO_GROUP_LABEL).toBe('Free demo');
    expect(DEMO_TRY_BANNER).toContain('demo model');
    expect(DEMO_TRY_BANNER).toContain('not AI-generated');
  });

  it('recognizes the demo provider and nothing else', () => {
    expect(isDemoProvider('mock')).toBe(true);
    expect(isDemoProvider('openai')).toBe(false);
    expect(isDemoProvider('Mock')).toBe(false);
    expect(isDemoProvider(null)).toBe(false);
    expect(isDemoProvider(undefined)).toBe(false);
  });

  it('recognizes the demo model ref in both wire spellings', () => {
    expect(isDemoModelRef('neryva/demo')).toBe(true);
    expect(isDemoModelRef('mock/neryva/demo')).toBe(true);
    expect(isDemoModelRef('openai/gpt-4o-mini')).toBe(false);
    expect(isDemoModelRef('neryva/demo-extra')).toBe(false);
    expect(isDemoModelRef('')).toBe(false);
    expect(isDemoModelRef(null)).toBe(false);
  });

  it('recognizes the demo quota product', () => {
    expect(isDemoQuotaProduct('agent_studio_demo')).toBe(true);
    expect(isDemoQuotaProduct('agent_studio')).toBe(false);
    expect(isDemoQuotaProduct(null)).toBe(false);
  });

  it('reads the quota product off error details without guessing', () => {
    expect(quotaProductFromDetails({ product: 'agent_studio_demo' })).toBe('agent_studio_demo');
    expect(quotaProductFromDetails({ product: 'agent_studio' })).toBe('agent_studio');
    expect(quotaProductFromDetails({})).toBeNull();
    expect(quotaProductFromDetails({ product: '' })).toBeNull();
    expect(quotaProductFromDetails({ product: 42 })).toBeNull();
    expect(quotaProductFromDetails(null)).toBeNull();
    expect(quotaProductFromDetails('agent_studio_demo')).toBeNull();
  });
});
