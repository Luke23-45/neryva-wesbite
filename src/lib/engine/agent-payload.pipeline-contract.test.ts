import { beforeAll, describe, expect, it } from 'vitest';
import {
  defaultConsumer,
  toEnginePayload,
  type ConsumerDefinition,
  type ModelPipelineEntry,
} from './agent-payload';
import { readEnginePipelineSchema } from '../../test-utils/readEnginePipelineSchema';

/**
 * P2-1 (WEB-005) consumer contract test: the website's model-pipeline wire
 * payload must satisfy the ENGINE's `pipelineEntrySchema`
 * (neryva-engine/src/modules/assistants/validation.ts) — the engine is the
 * contract authority. The schema is read live out of the engine source at
 * test time (see readEnginePipelineSchema), never a frozen copy.
 *
 * The website's own `ModelPipelineEntry` type is looser than the engine
 * schema (plain `number`/`string`), so these tests pin the wire builder
 * (`toEnginePayload` → `cleanPipelineEntry`), not the types.
 */
describe('model pipeline wire contract (P2-1 / WEB-005)', () => {
  let engineEntrySchema: { safeParse: (v: unknown) => { success: boolean } };

  beforeAll(() => {
    engineEntrySchema = readEnginePipelineSchema().schema;
  });

  function consumerWithPipeline(pipeline: ModelPipelineEntry[]): ConsumerDefinition {
    const def = defaultConsumer();
    def.model_policy = {
      allowed_models: pipeline.map((e) => e.ref),
      fallback_enabled: false,
      pipeline,
    };
    return def;
  }

  function wirePipeline(def: ConsumerDefinition): unknown[] {
    const payload = toEnginePayload(def);
    const pipeline = payload.model_policy.pipeline;
    expect(Array.isArray(pipeline)).toBe(true);
    return pipeline as unknown[];
  }

  it('a fully-populated valid entry passes the engine schema', () => {
    const entries = wirePipeline(
      consumerWithPipeline([
        {
          ref: 'openai/gpt-4o',
          credential_id: '123e4567-e89b-12d3-a456-426614174000',
          version_pin: 'gpt-4o-2024-05-13',
          params: {
            temperature: 0.7,
            max_output_tokens: 1000,
            top_p: 0.9,
            reasoning_effort: 'low',
            output_schema: '{"type":"object"}',
          },
        },
        { ref: 'anthropic/claude-sonnet-4-5' },
      ]),
    );
    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      expect(engineEntrySchema.safeParse(entry).success).toBe(true);
    }
  });

  it('drops out-of-range param overrides so the wire entry stays engine-valid', () => {
    // Every value below is allowed by the website's loose types but rejected
    // by the engine schema: temperature > 2, top_p = 0 (engine: gt(0)),
    // max_output_tokens < 1, non-JSON output_schema.
    const entries = wirePipeline(
      consumerWithPipeline([
        {
          ref: 'openai/gpt-4o',
          params: {
            temperature: 5,
            max_output_tokens: 0,
            top_p: 0,
            output_schema: '{not json',
          },
        },
      ]),
    );
    expect(entries).toHaveLength(1);
    const entry = entries[0] as Record<string, unknown>;
    // All overrides dropped (absent = engine default); the entry itself
    // must still validate.
    expect(entry.params).toBeUndefined();
    expect(engineEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('drops a non-integer max_output_tokens', () => {
    const entries = wirePipeline(
      consumerWithPipeline([{ ref: 'openai/gpt-4o', params: { max_output_tokens: 10.5 } }]),
    );
    const entry = entries[0] as Record<string, unknown>;
    expect(entry.params).toBeUndefined();
    expect(engineEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('keeps in-range overrides verbatim', () => {
    const entries = wirePipeline(
      consumerWithPipeline([
        { ref: 'openai/gpt-4o', params: { temperature: 0, top_p: 1, max_output_tokens: 200_000 } },
      ]),
    );
    const entry = entries[0] as { params?: Record<string, unknown> };
    expect(entry.params).toEqual({ temperature: 0, top_p: 1, max_output_tokens: 200_000 });
    expect(engineEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('throws on a ref outside the engine model-ref pattern (programmer error)', () => {
    expect(() =>
      toEnginePayload(consumerWithPipeline([{ ref: 'NOT A REF' }])),
    ).toThrow(/model ref/i);
  });

  it('throws on a non-UUID credential_id (programmer error)', () => {
    expect(() =>
      toEnginePayload(consumerWithPipeline([{ ref: 'openai/gpt-4o', credential_id: 'not-a-uuid' }])),
    ).toThrow(/UUID/);
  });

  it('throws on a version_pin longer than the engine 256-char cap', () => {
    expect(() =>
      toEnginePayload(consumerWithPipeline([{ ref: 'openai/gpt-4o', version_pin: 'x'.repeat(300) }])),
    ).toThrow(/version_pin/);
  });

  it('strips unknown keys (the engine schema is strict)', () => {
    const entries = wirePipeline(
      consumerWithPipeline([
        { ref: 'openai/gpt-4o', bogus: 'nope', params: { temperature: 0.5, nope: 1 } } as unknown as ModelPipelineEntry,
      ]),
    );
    const entry = entries[0] as Record<string, unknown>;
    expect(entry).not.toHaveProperty('bogus');
    expect((entry.params as Record<string, unknown> ?? {})).not.toHaveProperty('nope');
    expect(engineEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('website ref guard agrees with the engine model-ref pattern', () => {
    // The website throws on refs its MODEL_REF_PATTERN mirror rejects; the
    // engine rejects on its live pattern. The two must agree in both
    // directions, or the mirror has drifted.
    const cases: Array<[string, boolean]> = [
      ['openai/gpt-4o', true],
      ['anthropic/claude-sonnet-4-5', true],
      ['mock/neryva/demo', true],
      ['my-provider/model_v2.1', true],
      ['NOT A REF', false],
      ['OpenAI/gpt-4o', false],
      ['openai/', false],
      ['/gpt-4o', false],
      ['openai//gpt-4o', false],
      ['noslash', false],
    ];
    for (const [ref, engineValid] of cases) {
      const engineSaysValid = engineEntrySchema.safeParse({ ref }).success;
      expect(engineSaysValid).toBe(engineValid);
      let websiteThrew = false;
      try {
        toEnginePayload(consumerWithPipeline([{ ref }]));
      } catch {
        websiteThrew = true;
      }
      expect(websiteThrew).toBe(!engineValid);
    }
  });
});
