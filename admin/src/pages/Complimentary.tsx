import './Complimentary.css';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/Input/Input';
import { Button } from '@/components/Button/Button';
import { Badge } from '@/components/Badge/Badge';

interface Result {
  userId: string;
  action: 'granted' | 'revoked';
  plan?: string;
}

async function resolveToUserId(input: string): Promise<string> {
  if (!input.includes('@')) return input;
  const data = await api.users(1, 1, input);
  const match = data.users.find((u) => u.email.toLowerCase() === input.toLowerCase());
  if (!match) throw new Error(`No user found with email: ${input}`);
  return match.id;
}

export function Complimentary(): React.ReactElement {
  const [userInput, setUserInput] = useState('');
  const [planCode, setPlanCode] = useState<'pro' | 'team'>('pro');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGrant(e: React.FormEvent): void {
    e.preventDefault();
    if (!userInput.trim()) return;
    setLoading(true);
    setError(null);
    resolveToUserId(userInput.trim())
      .then((userId) => api.grantComplimentary(userId, planCode).then(() => userId))
      .then((userId) => setResult({ userId, action: 'granted', plan: planCode }))
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }

  function handleRevoke(): void {
    if (!userInput.trim()) return;
    setLoading(true);
    setError(null);
    resolveToUserId(userInput.trim())
      .then((userId) => api.revokeComplimentary(userId).then(() => userId))
      .then((userId) => setResult({ userId, action: 'revoked' }))
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }

  return (
    <div className="comp">
      <p className="comp__description">
        Grant or revoke complimentary paid access for a user. Enter a user ID or email address.
      </p>

      <div className="comp__card">
        <form className="comp__form" onSubmit={handleGrant}>
          <Input
            label="User ID or Email"
            id="comp-user-id"
            placeholder="e.g. usr_xxxxxxxxxxxx or user@example.com"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />

          <div className="comp__plan-select">
            <label className="comp__plan-label">Plan</label>
            <div className="comp__plan-options">
              <label className="comp__plan-option">
                <input
                  type="radio"
                  name="plan"
                  value="pro"
                  checked={planCode === 'pro'}
                  onChange={() => setPlanCode('pro')}
                />
                Pro
              </label>
              <label className="comp__plan-option">
                <input
                  type="radio"
                  name="plan"
                  value="team"
                  checked={planCode === 'team'}
                  onChange={() => setPlanCode('team')}
                />
                Team
              </label>
            </div>
          </div>

          <div className="comp__actions">
            <Button type="submit" loading={loading}>Grant Access</Button>
            <Button type="button" variant="danger" onClick={handleRevoke} loading={loading}>
              Revoke Access
            </Button>
          </div>
        </form>

        {error && <p className="comp__error">{error}</p>}

        {result && (
          <div className="comp__result">
            <span>User <code>{result.userId}</code>: </span>
            <Badge variant={result.action === 'granted' ? 'success' : 'warning'}>
              {result.action === 'granted' ? `Granted ${result.plan ?? ''}` : 'Revoked'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
