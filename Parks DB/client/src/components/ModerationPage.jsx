// Moderation page — visible only to moderator/admin. Lists pending submissions
// and lets the moderator approve or reject each one.
import { useEffect, useState } from 'react';
import { api } from '../api.js';

export function ModerationPage({ onBack }) {
    const [items, setItems]   = useState([]);
    const [status, setStatus] = useState('pending');
    const [error, setError]   = useState(null);

    async function load() {
        try { const { submissions } = await api.get('/submissions', { query: { status } }); setItems(submissions); }
        catch (err) { setError(err.message); }
    }
    useEffect(() => { load(); }, [status]);

    async function approve(id) {
        try { await api.post(`/submissions/${id}/approve`, {}); load(); }
        catch (err) { alert(err.message); }
    }
    async function reject(id) {
        const note = prompt('Reason for rejection?');
        if (!note) return;
        try { await api.post(`/submissions/${id}/reject`, { note }); load(); }
        catch (err) { alert(err.message); }
    }

    return (
        <div>
            <div className="topbar">
                <h1>Moderation queue</h1>
                <nav>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button className="secondary" onClick={onBack}>Back to map</button>
                </nav>
            </div>
            <div className="mod-list">
                {error && <div className="error">{error}</div>}
                {items.length === 0 && <p style={{ color: 'var(--muted)' }}>Nothing in this queue.</p>}
                {items.map((s) => (
                    <div key={s.id} className="mod-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>
                                #{s.id} · {s.kind === 'create' ? 'New park' : `Edit to park #${s.targetParkId}`}
                            </strong>
                            <span style={{ color: 'var(--muted)' }}>
                                {s.submitterEmail || 'unknown'} · {new Date(s.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <pre>{JSON.stringify(s.payload, null, 2)}</pre>
                        {s.moderatorNote && <div><em>Moderator note:</em> {s.moderatorNote}</div>}
                        {s.status === 'pending' && (
                            <div className="actions">
                                <button className="danger" onClick={() => reject(s.id)}>Reject</button>
                                <button onClick={() => approve(s.id)}>Approve</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
