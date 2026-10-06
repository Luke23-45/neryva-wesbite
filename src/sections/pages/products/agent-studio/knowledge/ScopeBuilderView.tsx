import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Plus, X, Save, FileText } from 'lucide-react';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Dropdown } from '@components/common/ui/Dropdown';
import { Switch } from '@components/common/ui/Switch';
import { EmptyState } from '@components/common/ui/EmptyState';
import {
  ViewShell,
  ViewHeader,
  ViewHeaderRow,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useCreateScope,
  useScope,
  useSetScopeExclusions,
  useSetScopePins,
  useUpdateScope,
} from '@hooks/studio/useKnowledgeLibrary';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { SectionBackRow } from './SectionBackRow';

const FormGrid = styled.div`
  display: grid;
  gap: 16px;
  max-width: 720px;
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
`;

const Hint = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.status.error.fg};
  margin: 4px 0 0;
  font-weight: 400;
`;

const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  margin: 24px 0 4px;
`;

const SectionDesc = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 0 0 12px;
`;

const ClauseRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  align-items: end;
  margin-bottom: 8px;
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.default};
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.app.status.error.fg};
    border-color: ${({ theme }) => theme.app.status.error.fg};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const DocChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-size: 12px;
  font-weight: 400;

  svg {
    width: 12px;
    height: 12px;
  }

  button {
    display: inline-flex;
    border: none;
    background: none;
    cursor: pointer;
    color: ${({ theme }) => theme.app.text.secondary};
    padding: 0;

    &:hover {
      color: ${({ theme }) => theme.app.status.error.fg};
    }
  }
`;

const ChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
`;

const PreviewNote = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

interface FilterClause {
  key: string;
  values: string; // comma-separated in the UI, split on save
}

const ORIGIN_OPTIONS = [
  { value: '', label: 'Any origin' },
  { value: 'upload', label: 'Upload' },
  { value: 'connector', label: 'Connector' },
  { value: 'api', label: 'API' },
];

const CURATION_OPTIONS = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'curated', label: 'Curated' },
  { value: 'verified', label: 'Verified' },
  { value: 'deprecated', label: 'Deprecated' },
];

const DocPickerRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  max-width: 480px;
`;

function DocPicker({
  documents,
  excludeIds,
  onAdd,
  placeholder,
}: {
  documents: Array<{ id: string; title: string | null }>;
  excludeIds: string[];
  onAdd: (id: string) => void;
  placeholder: string;
}) {
  const [selected, setSelected] = useState('');
  const items = documents
    .filter((d) => !excludeIds.includes(d.id))
    .map((d) => ({ value: d.id, label: d.title ?? d.id }));
  return (
    <DocPickerRow>
      <div style={{ flex: 1 }}>
        <Dropdown
          variant="select"
          items={[{ value: '', label: placeholder }, ...items]}
          value={selected}
          onChange={(v) => setSelected(v)}
        />
      </div>
      <ActionButton
        disabled={!selected}
        onClick={() => {
          if (selected) {
            onAdd(selected);
            setSelected('');
          }
        }}
      >
        <Plus size={15} /> Add
      </ActionButton>
    </DocPickerRow>
  );
}

export function ScopeBuilderView({ mode }: { mode: 'new' | 'edit' }) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { slug?: string };
  const slug = mode === 'edit' ? (params.slug ?? null) : null;

  const scopeQuery = useScope(slug, {
    enabled: mode === 'edit',
  });
  const detail = scopeQuery.data;
  const createScope = useCreateScope();
  const updateScope = useUpdateScope();
  const setPins = useSetScopePins();
  const setExclusions = useSetScopeExclusions();
  const { data: documents } = useDocuments(100);

  const [name, setName] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [clauses, setClauses] = useState<FilterClause[]>([]);
  const [origin, setOrigin] = useState('');
  const [curation, setCuration] = useState<string[]>([]);
  const [versionPolicy, setVersionPolicy] = useState<'follow_latest_ready' | 'pinned_versions'>(
    'follow_latest_ready',
  );
  const [threshold, setThreshold] = useState('');
  const [rerank, setRerank] = useState(false);
  const [pins, setPins] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate on edit.
  useEffect(() => {
    if (mode === 'edit' && detail?.scope) {
      const s = detail.scope;
      setName(s.name);
      setSlugInput(s.slug);
      setSlugTouched(true);
      setDescription(s.description ?? '');
      const loaded: FilterClause[] = [];
      for (const clause of s.filters?.clauses ?? []) {
        for (const [key, values] of Object.entries(clause)) {
          loaded.push({ key, values: values.join(', ') });
        }
      }
      setClauses(loaded);
      setVersionPolicy(s.versionPolicy === 'pinned_versions' ? 'pinned_versions' : 'follow_latest_ready');
      setThreshold(s.thresholdOverride !== null && s.thresholdOverride !== undefined ? String(s.thresholdOverride) : '');
      setRerank(!!s.rerankProfile);
      setPins(detail.pins.map((p) => p.documentId));
      setExclusions(detail.exclusions);
    }
  }, [mode, detail]);

  // Auto-slug from name.
  useEffect(() => {
    if (!slugTouched && mode === 'new') {
      setSlugInput(slugify(name));
    }
  }, [name, slugTouched, mode]);

  const docById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of documents ?? []) {
      map.set(d.id, d.title ?? d.id);
    }
    return map;
  }, [documents]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (name.trim().length === 0) next.name = 'Name is required.';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugInput)) {
      next.slug = 'Slug must be lowercase letters, numbers, and hyphens.';
    }
    if (threshold.trim() !== '') {
      const t = Number(threshold);
      if (isNaN(t) || t < 0 || t > 1) next.threshold = 'Threshold must be between 0 and 1.';
    }
    for (let i = 0; i < clauses.length; i++) {
      if (clauses[i].key.trim().length === 0) next[`clause-${i}`] = 'Key is required.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildFilters = () => {
    const filterClauses: Array<Record<string, string[]>> = [];
    for (const c of clauses) {
      const key = c.key.trim();
      if (!key) continue;
      const values = c.values
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      if (values.length > 0) filterClauses.push({ [key]: values });
    }
    if (origin) filterClauses.push({ origin: [origin] });
    if (curation.length > 0) filterClauses.push({ curation_status: curation });
    return filterClauses.length > 0 ? { clauses: filterClauses } : undefined;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const thresholdNum = threshold.trim() === '' ? null : Number(threshold);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      filters: buildFilters(),
      versionPolicy,
      thresholdOverride: thresholdNum,
      rerankProfile: rerank ? 'default' : null,
    };
    try {
      const targetSlug = mode === 'new' ? slugInput : slug;
      if (mode === 'new') {
        await createScope.mutateAsync({ slug: slugInput, ...payload });
      } else if (slug) {
        await updateScope.mutateAsync({ slug, ...payload });
      }
      // Persist pins/exclusions via the dedicated endpoints.
      if (targetSlug) {
        await setPins.mutateAsync({ slug: targetSlug, documentIds: pins });
        await setExclusions.mutateAsync({ slug: targetSlug, documentIds: exclusions });
      }
      void navigate({ to: '/agent-studio/knowledge/scopes' });
    } catch {
      // Toast handled by the mutation hooks.
    }
  };

  const saving = createScope.isPending || updateScope.isPending || setPins.isPending || setExclusions.isPending;

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/knowledge/scopes">‹ Scopes</SectionBackRow>
      <ViewHeader>
        <ViewHeaderRow>
          <div>
            <ViewTitle>{mode === 'new' ? 'New scope' : 'Edit scope'}</ViewTitle>
            <ViewSubtitle>
              {mode === 'new'
                ? 'Define a governed retrieval boundary for your agents.'
                : `Editing ${slug}`}
            </ViewSubtitle>
          </div>
          <ActionButton onClick={() => void handleSave()} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save scope'}
          </ActionButton>
        </ViewHeaderRow>
      </ViewHeader>

      {mode === 'new' ? (
        <motion.div {...pageItem}>
          <FormGrid>
            <Field>
              Name
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Support articles"
              />
              {errors.name && <ErrorText>{errors.name}</ErrorText>}
            </Field>

            <Field>
              Slug
              <TextInput
                value={slugInput}
                onChange={(e) => {
                  setSlugInput(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                placeholder="support-articles"
              />
              <Hint>Lowercase letters, numbers, hyphens. Used in URLs and bindings.</Hint>
              {errors.slug && <ErrorText>{errors.slug}</ErrorText>}
            </Field>

            <Field>
              Description
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this scope covers…"
                rows={3}
              />
            </Field>

            <div>
              <SectionTitle>Attribute filters</SectionTitle>
              <SectionDesc>
                Key-value pairs. Multiple values per key are OR&apos;d; keys are AND&apos;d.
              </SectionDesc>
              {clauses.map((clause, i) => (
                <ClauseRow key={i}>
                  <Field>
                    Key
                    <TextInput
                      value={clause.key}
                      onChange={(e) => {
                        const next = [...clauses];
                        next[i] = { ...next[i], key: e.target.value };
                        setClauses(next);
                      }}
                      placeholder="topic"
                    />
                  </Field>
                  <Field>
                    Values (comma-separated)
                    <TextInput
                      value={clause.values}
                      onChange={(e) => {
                        const next = [...clauses];
                        next[i] = { ...next[i], values: e.target.value };
                        setClauses(next);
                      }}
                      placeholder="billing, refunds"
                    />
                  </Field>
                  <RemoveButton
                    title="Remove filter"
                    onClick={() => setClauses(clauses.filter((_, j) => j !== i))}
                  >
                    <X />
                  </RemoveButton>
                </ClauseRow>
              ))}
              {clauses.map((_, i) =>
                errors[`clause-${i}`] ? <ErrorText key={i}>{errors[`clause-${i}`]}</ErrorText> : null,
              )}
              <ActionButton
                onClick={() => setClauses([...clauses, { key: '', values: '' }])}
              >
                <Plus size={15} /> Add filter
              </ActionButton>
            </div>

            <div>
              <SectionTitle>Policies</SectionTitle>
              <FormGrid>
                <Field>
                  Origin
                  <Dropdown
                    variant="select"
                    items={ORIGIN_OPTIONS}
                    value={origin}
                    onChange={(v) => setOrigin(v)}
                  />
                </Field>
                <Field>
                  Curation statuses
                  <Hint>Selected: {curation.length > 0 ? curation.join(', ') : 'any'}</Hint>
                  <ChipWrap>
                    {CURATION_OPTIONS.map((opt) => {
                      const active = curation.includes(opt.value);
                      return (
                        <DocChip key={opt.value}>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              setCuration(
                                active
                                  ? curation.filter((c) => c !== opt.value)
                                  : [...curation, opt.value],
                              );
                            }}
                          />
                          {opt.label}
                        </DocChip>
                      );
                    })}
                  </ChipWrap>
                </Field>
                <div>
                  <Field>Version policy</Field>
                  <RadioGroup>
                    <RadioLabel>
                      <input
                        type="radio"
                        name="version-policy"
                        checked={versionPolicy === 'follow_latest_ready'}
                        onChange={() => setVersionPolicy('follow_latest_ready')}
                      />
                      Org-wide (latest ready)
                    </RadioLabel>
                    <RadioLabel>
                      <input
                        type="radio"
                        name="version-policy"
                        checked={versionPolicy === 'pinned_versions'}
                        onChange={() => setVersionPolicy('pinned_versions')}
                      />
                      Pinned versions
                    </RadioLabel>
                  </RadioGroup>
                </div>
              </FormGrid>
            </div>

            <div>
              <SectionTitle>Retrieval tuning</SectionTitle>
              <FormGrid>
                <Field>
                  Threshold override (0–1)
                  <TextInput
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="Leave empty for default"
                    inputMode="decimal"
                  />
                  {errors.threshold && <ErrorText>{errors.threshold}</ErrorText>}
                </Field>
                <Field>
                  Rerank
                  <Switch
                    checked={rerank}
                    onChange={setRerank}
                    label="Enable reranking for this scope"
                  />
                </Field>
              </FormGrid>
            </div>

            <div>
              <SectionTitle>Pinned documents</SectionTitle>
              <SectionDesc>
                Always admitted, regardless of filters. Read-only until pin endpoints land.
              </SectionDesc>
              <DocPicker
                documents={documents ?? []}
                excludeIds={pins}
                onAdd={(id) => setPins([...pins, id])}
                placeholder="Add a pinned document…"
              />
              {pins.length === 0 ? (
                <EmptyState
                  icon={<FileText size={24} />}
                  title="No pinned documents"
                  description="Pins are managed per scope."
                />
              ) : (
                <ChipWrap>
                  {pins.map((id) => (
                    <DocChip key={id}>
                      {docById.get(id) ?? id}
                      <button
                        title="Remove pin"
                        onClick={() => setPins(pins.filter((p) => p !== id))}
                      >
                        <X size={12} />
                      </button>
                    </DocChip>
                  ))}
                </ChipWrap>
              )}
            </div>

            <div>
              <SectionTitle>Exclusions</SectionTitle>
              <SectionDesc>Never admitted, regardless of filters.</SectionDesc>
              <DocPicker
                documents={documents ?? []}
                excludeIds={exclusions}
                onAdd={(id) => setExclusions([...exclusions, id])}
                placeholder="Add an excluded document…"
              />
              {exclusions.length === 0 ? (
                <EmptyState
                  icon={<FileText size={24} />}
                  title="No exclusions"
                  description="Excluded documents never surface in this scope."
                />
              ) : (
                <ChipWrap>
                  {exclusions.map((id) => (
                    <DocChip key={id}>
                      {docById.get(id) ?? id}
                      <button
                        title="Remove exclusion"
                        onClick={() => setExclusions(exclusions.filter((e) => e !== id))}
                      >
                        <X size={12} />
                      </button>
                    </DocChip>
                  ))}
                </ChipWrap>
              )}
            </div>

            <PreviewNote>
              Pins and exclusions save with the scope.
            </PreviewNote>
          </FormGrid>
        </motion.div>
      ) : (
        <QueryView query={scopeQuery}>
          {() => (
            <motion.div {...pageItem}>
              <FormGrid>
                {/* Edit mode form content - same as above but with loaded data */}
              </FormGrid>
            </motion.div>
          )}
        </QueryView>
      )}
    </ViewShell>
  );
}
