/**
 * The step-up UI. State + `requestStepUp()` live in `@lib/engine/stepup`
 * (hooks await proofs without importing components); this modal mounts
 * once per shell and renders whenever a proof is pending.
 */
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Modal } from '@components/common/ui/Modal/Modal';
import { TextInput } from '@components/common/ui/TextInput/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton/ActionButton';
import { engine, ApiError } from '@lib/engine/client';
import { useStepUpStore } from '@lib/engine/stepup';

export function StepUpModal() {
  const pending = useStepUpStore((s) => s.pending);
  const deliver = useStepUpStore((s) => s.deliver);
  const fail = useStepUpStore((s) => s.fail);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = pending !== null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await engine<{ proof: string; expires_in_seconds: number }>('/auth/mfa/proof', {
        method: 'POST',
        body: { code: code.trim() },
      });
      deliver(result.proof);
      setCode('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed — try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setCode('');
        setError(null);
        fail(new Error('Step-up verification cancelled'));
      }}
      title="Confirm with your authenticator"
      footer={
        <>
          <ActionButton variant="ghost" onClick={() => { setCode(''); setError(null); fail(new Error('Step-up verification cancelled')); }}>Cancel</ActionButton>
          <ActionButton variant="primary" disabled={code.trim().length < 6 || busy} onClick={() => void submit()}>
            <ShieldCheck size={13} /> Verify
          </ActionButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4, maxWidth: 380 }}>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
          {pending?.act ? `"${pending.act}" is a privileged action.` : 'This action is privileged.'} Enter a live code from your authenticator (or a recovery code) to continue.
        </p>
        <TextInput
          label="Authenticator code"
          name="stepup-code"
          placeholder="123 456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={error ?? undefined}
          autoFocus
        />
        <p style={{ margin: 0, fontSize: 12, opacity: 0.65 }}>
          No authenticator yet?{' '}
          <Link to="/agent-studio/settings/security" style={{ textDecoration: 'underline' }}>
            Set one up in Settings → Security
          </Link>
          , then return here.
        </p>
      </div>
    </Modal>
  );
}
