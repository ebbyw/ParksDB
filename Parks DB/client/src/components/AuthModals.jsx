// Login + Register modals. Kept intentionally minimal; CAPTCHA token is
// passed through if/when a real hCaptcha widget is integrated. In dev mode
// the server ignores missing tokens (CAPTCHA_DISABLED=true).
import { useState } from 'react';
import { useAuth } from '../auth.jsx';

export function LoginModal({ onClose, onSwitchToRegister }) {
    const { login } = useAuth();
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState(null);
    const [busy, setBusy]         = useState(false);

    async function submit(e) {
        e.preventDefault();
        setError(null); setBusy(true);
        try { await login(email, password); onClose(); }
        catch (err) { setError(err.message); }
        finally { setBusy(false); }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <h2>Sign in</h2>
                {error && <div className="error">{error}</div>}
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <div className="actions">
                    <button type="button" className="secondary" onClick={onSwitchToRegister}>
                        Create account
                    </button>
                    <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
                </div>
            </form>
        </div>
    );
}

export function RegisterModal({ onClose, onSwitchToLogin }) {
    const { register } = useAuth();
    const [email, setEmail]             = useState('');
    const [password, setPassword]       = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError]             = useState(null);
    const [busy, setBusy]               = useState(false);

    async function submit(e) {
        e.preventDefault();
        setError(null); setBusy(true);
        try {
            await register({ email, password, displayName: displayName || undefined });
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <h2>Create your account</h2>
                {error && <div className="error">{error}</div>}
                <label>Display name (optional)</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label>Password (min 10 chars, letters + digits)</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} />
                <div className="actions">
                    <button type="button" className="secondary" onClick={onSwitchToLogin}>
                        Have an account?
                    </button>
                    <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
                </div>
            </form>
        </div>
    );
}
