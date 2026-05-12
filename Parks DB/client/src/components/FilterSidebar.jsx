// Filter sidebar — groups features by `kind` first, then by `category` for
// finer grouping inside facilities/amenities. Park types render as
// pill toggles at the top because they describe what the park IS;
// the rest render as checkbox lists.
import { useMemo } from 'react';

const KIND_ORDER = ['park_type', 'facility', 'amenity', 'accessibility', 'environment'];
const KIND_LABEL = {
    park_type:     'Park type',
    facility:      'Facilities',
    amenity:       'Amenities',
    accessibility: 'Accessibility',
    environment:   'Environment',
};

export function FilterSidebar({ features, selected, onChange, q, onQChange }) {
    // Group: kind -> category -> features
    const byKind = useMemo(() => {
        const m = new Map();
        for (const f of features) {
            const k = f.kind || 'amenity';
            if (!m.has(k)) m.set(k, new Map());
            const cat = f.category || 'other';
            const inner = m.get(k);
            if (!inner.has(cat)) inner.set(cat, []);
            inner.get(cat).push(f);
        }
        return m;
    }, [features]);

    function toggle(slug) {
        const next = new Set(selected);
        next.has(slug) ? next.delete(slug) : next.add(slug);
        onChange(next);
    }

    const parkTypes = byKind.get('park_type');

    return (
        <aside className="sidebar">
            <h3>Search</h3>
            <input
                type="text"
                placeholder="Park name…"
                value={q}
                onChange={(e) => onQChange(e.target.value)}
            />

            {parkTypes && (
                <>
                    <h3 style={{ marginTop: 20 }}>{KIND_LABEL.park_type}</h3>
                    <div className="pill-grid">
                        {Array.from(parkTypes.values()).flat().map((f) => (
                            <button
                                key={f.slug}
                                type="button"
                                className={`pill ${selected.has(f.slug) ? 'pill-on' : ''}`}
                                onClick={() => toggle(f.slug)}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {KIND_ORDER.filter((k) => k !== 'park_type').map((kind) => {
                const cats = byKind.get(kind);
                if (!cats) return null;
                return (
                    <section key={kind}>
                        <h3 style={{ marginTop: 20 }}>{KIND_LABEL[kind]}</h3>
                        {Array.from(cats.entries())
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([cat, list]) => (
                                <div key={cat} className="feature-group">
                                    <div className="cat-label">{cat}</div>
                                    {list.map((f) => (
                                        <label key={f.slug} className="feature-row">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(f.slug)}
                                                onChange={() => toggle(f.slug)}
                                            />
                                            <span>{f.name}</span>
                                        </label>
                                    ))}
                                </div>
                            ))}
                    </section>
                );
            })}

            {selected.size > 0 && (
                <button
                    className="secondary"
                    style={{ marginTop: 12, width: '100%' }}
                    onClick={() => onChange(new Set())}
                >
                    Clear {selected.size} filter{selected.size === 1 ? '' : 's'}
                </button>
            )}
        </aside>
    );
}
