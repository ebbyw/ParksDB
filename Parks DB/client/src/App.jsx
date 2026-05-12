// Main app shell. Two "pages": map (default) and moderation. We don't pull
// in a router for the MVP — keeping the dep list small.
import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from './api.js';
import { useAuth } from './auth.jsx';
import { FilterSidebar } from './components/FilterSidebar.jsx';
import { ParkDetail } from './components/ParkDetail.jsx';
import { LoginModal, RegisterModal } from './components/AuthModals.jsx';
import { ParkFormModal } from './components/ParkFormModal.jsx';
import { ModerationPage } from './components/ModerationPage.jsx';

// Marker icon fix (Vite doesn't auto-resolve Leaflet's bundled images)
const defaultIcon = L.icon({
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = defaultIcon;

function BoundsWatcher({ onChange }) {
    const map = useMapEvents({
        moveend: () => onChange(map.getBounds()),
        zoomend: () => onChange(map.getBounds()),
        load:    () => onChange(map.getBounds()),
    });
    useEffect(() => { onChange(map.getBounds()); }, []);
    return null;
}

export default function App() {
    const { user, loading, logout } = useAuth();

    const [page, setPage]               = useState('map');
    const [features, setFeatures]       = useState([]);
    const [selectedSlugs, setSelected]  = useState(new Set());
    const [q, setQ]                     = useState('');
    const [parks, setParks]             = useState([]);
    const [bounds, setBounds]           = useState(null);
    const [activePark, setActivePark]   = useState(null);

    const [showLogin, setShowLogin]       = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [parkForm, setParkForm]         = useState(null); // { mode, park }

    // Load feature catalog once.
    useEffect(() => {
        (async () => {
            try {
                const { features } = await api.get('/features');
                setFeatures(features);
            } catch (err) { console.error(err); }
        })();
    }, []);

    // Fetch parks whenever bounds, filters, or q change.
    useEffect(() => {
        if (!bounds) return;
        const handle = setTimeout(load, 250); // light debounce
        return () => clearTimeout(handle);

        async function load() {
            try {
                const bbox = [
                    bounds.getWest(), bounds.getSouth(),
                    bounds.getEast(), bounds.getNorth(),
                ].map((n) => n.toFixed(6)).join(',');
                const params = { bbox, limit: 200 };
                if (selectedSlugs.size) params.features = Array.from(selectedSlugs).join(',');
                if (q.trim())           params.q = q.trim();
                const { parks } = await api.get('/parks', { query: params });
                setParks(parks);
            } catch (err) { console.error(err); }
        }
    }, [bounds, selectedSlugs, q]);

    const onSubmitted = useCallback(() => {
        setParkForm(null);
        alert('Thanks! Your submission is queued for review.');
    }, []);

    if (loading) return <div style={{ padding: 40 }}>Loading…</div>;

    if (page === 'moderation') {
        return <ModerationPage onBack={() => setPage('map')} />;
    }

    return (
        <>
            <div className="topbar">
                <h1>🌳 ParksDB</h1>
                <nav>
                    {user ? (
                        <>
                            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                                {user.displayName || user.email}
                            </span>
                            {user.role !== 'user' && (
                                <span className="role-badge">{user.role}</span>
                            )}
                            <button className="secondary" onClick={() => setParkForm({ mode: 'create' })}>
                                + Add a park
                            </button>
                            {(user.role === 'moderator' || user.role === 'admin') && (
                                <button className="secondary" onClick={() => setPage('moderation')}>
                                    Moderation
                                </button>
                            )}
                            <button className="secondary" onClick={logout}>Sign out</button>
                        </>
                    ) : (
                        <>
                            <button className="secondary" onClick={() => setShowLogin(true)}>Sign in</button>
                            <button onClick={() => setShowRegister(true)}>Create account</button>
                        </>
                    )}
                </nav>
            </div>

            <div className="layout">
                <FilterSidebar
                    features={features}
                    selected={selectedSlugs}
                    onChange={setSelected}
                    q={q}
                    onQChange={setQ}
                />

                <div className="map-wrap">
                    <MapContainer center={[39.5, -98.35]} zoom={4} scrollWheelZoom>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <BoundsWatcher onChange={setBounds} />
                        {parks.map((p) => (
                            <Marker
                                key={p.id}
                                position={[p.lat, p.lng]}
                                eventHandlers={{ click: () => setActivePark(p) }}
                            />
                        ))}
                    </MapContainer>

                    {parks.length === 0 && bounds && (
                        <div className="empty-hint">No parks match this view & filters — pan, zoom, or clear filters.</div>
                    )}

                    {activePark && (
                        <ParkDetail
                            park={activePark}
                            onClose={() => setActivePark(null)}
                            onEdit={(park) => setParkForm({ mode: 'edit', park })}
                        />
                    )}
                </div>
            </div>

            {showLogin && (
                <LoginModal
                    onClose={() => setShowLogin(false)}
                    onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }}
                />
            )}
            {showRegister && (
                <RegisterModal
                    onClose={() => setShowRegister(false)}
                    onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }}
                />
            )}
            {parkForm && (
                <ParkFormModal
                    features={features}
                    mode={parkForm.mode}
                    park={parkForm.park}
                    onClose={() => setParkForm(null)}
                    onSubmitted={onSubmitted}
                />
            )}
        </>
    );
}
