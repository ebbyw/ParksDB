// Modal for creating or editing a park.
//
// Location UX: rather than asking users to paste raw lat/lng (which they'd
// have to look up), we embed a small Leaflet map. They can:
//   1. Click "Find on map" — we geocode the typed address via Nominatim.
//   2. Click anywhere on the map to drop the pin.
//   3. Drag the pin to fine-tune.
// The lat/lng under the pin is what's submitted.
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { api } from '../api.js';

const KIND_ORDER = ['park_type', 'facility', 'amenity', 'accessibility', 'environment'];
const KIND_LABEL = {
    park_type:     'Park type',
    facility:      'Facilities',
    amenity:       'Amenities',
    accessibility: 'Accessibility',
    environment:   'Environment',
};

// Nominatim is OpenStreetMap's free geocoder. No API key, but the usage
// policy caps you at ~1 req/sec — fine for a form submission, not for bulk
// imports. If we ever need heavy geocoding, swap to a paid provider and
// proxy through the server.
async function geocode(parts) {
    const q = parts.filter(Boolean).join(', ');
    if (!q) return null;
    const url =
        'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({ q, format: 'json', limit: '1' });
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Geocoder error ${res.status}`);
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Map controller — places/moves the pin on map click and recenters when the
// parent updates lat/lng (e.g. after the geocoder returns).
function PinPicker({ lat, lng, onPick }) {
    const map = useMapEvents({
        click: (e) => onPick(e.latlng.lat, e.latlng.lng),
    });
    useEffect(() => {
        if (lat != null && lng != null) {
            map.setView([lat, lng], Math.max(map.getZoom(), 15));
        }
    }, [lat, lng]);
    if (lat == null || lng == null) return null;
    return (
        <Marker
            position={[lat, lng]}
            draggable
            eventHandlers={{
                dragend: (e) => {
                    const p = e.target.getLatLng();
                    onPick(p.lat, p.lng);
                },
            }}
        />
    );
}

export function ParkFormModal({ features, mode, park, onClose, onSubmitted }) {
    const isEdit = mode === 'edit';
    const [name, setName]               = useState(park?.name || '');
    const [description, setDescription] = useState(park?.description || '');
    const [address, setAddress]         = useState(park?.address || '');
    const [city, setCity]               = useState(park?.city || '');
    const [region, setRegion]           = useState(park?.region || '');
    const [lat, setLat]                 = useState(park?.lat ?? null);
    const [lng, setLng]                 = useState(park?.lng ?? null);
    const [selected, setSelected]       = useState(new Set(park?.features?.map((f) => f.id) || []));
    const [error, setError]             = useState(null);
    const [busy, setBusy]               = useState(false);
    const [geocoding, setGeocoding]     = useState(false);

    function toggle(id) {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    }

    async function findOnMap() {
        if (!address && !city) {
            setError('Add at least an address or a city before searching.');
            return;
        }
        setError(null); setGeocoding(true);
        try {
            const result = await geocode([address, city, region, 'US']);
            if (!result) {
                setError("Couldn't find that location. Drop the pin on the map manually, or refine the address.");
            } else {
                setLat(result.lat);
                setLng(result.lng);
            }
        } catch (err) {
            setError(`Geocoding failed: ${err.message}`);
        } finally {
            setGeocoding(false);
        }
    }

    async function submit(e) {
        e.preventDefault();
        if (lat == null || lng == null) {
            setError('Please place a pin on the map (click "Find on map" or click directly on the map).');
            return;
        }
        setError(null); setBusy(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim() || undefined,
                address: address.trim() || undefined,
                city: city.trim() || undefined,
                region: region.trim() || undefined,
                lat,
                lng,
                featureIds: Array.from(selected),
            };
            const body = isEdit
                ? { kind: 'edit', targetParkId: park.id, payload }
                : { kind: 'create', payload };
            await api.post('/submissions', body);
            onSubmitted();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    const hasPin = lat != null && lng != null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <h2>{isEdit ? 'Suggest edit' : 'Add a park'}</h2>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                    Submissions are reviewed by a moderator before going live.
                </div>
                {error && <div className="error">{error}</div>}

                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />

                <label>Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />

                <label>Street address</label>
                <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    maxLength={240}
                    placeholder="e.g. 1247 15th Ave E"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, minWidth: 0 }}>
                    <div style={{ minWidth: 0 }}>
                        <label>City</label>
                        <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <label>State</label>
                        <input value={region} onChange={(e) => setRegion(e.target.value)} maxLength={80} placeholder="WA" />
                    </div>
                </div>

                <label style={{ marginTop: 14 }}>Location</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <button type="button" className="secondary" onClick={findOnMap} disabled={geocoding}>
                        {geocoding ? 'Searching…' : 'Find on map'}
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        or click the map to drop a pin
                    </span>
                </div>
                <div className="mini-map">
                    <MapContainer
                        center={hasPin ? [lat, lng] : [39.5, -98.35]}
                        zoom={hasPin ? 15 : 4}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <PinPicker
                            lat={lat}
                            lng={lng}
                            onPick={(la, ln) => { setLat(la); setLng(ln); }}
                        />
                    </MapContainer>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {hasPin
                        ? `Pin: ${lat.toFixed(5)}, ${lng.toFixed(5)} — drag to fine-tune`
                        : 'No pin placed yet.'}
                </div>

                <label style={{ marginTop: 14 }}>Features</label>
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 6, padding: 8 }}>
                    {KIND_ORDER.map((kind) => {
                        const list = features.filter((f) => (f.kind || 'amenity') === kind);
                        if (!list.length) return null;
                        return (
                            <div key={kind} style={{ marginBottom: 8 }}>
                                <div className="cat-label" style={{ fontWeight: 600 }}>{KIND_LABEL[kind]}</div>
                                {list.map((f) => (
                                    <label key={f.id} className="feature-row" style={{ padding: '2px 0' }}>
                                        <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
                                        <span>{f.name} <span style={{ color: 'var(--muted)' }}>({f.category})</span></span>
                                    </label>
                                ))}
                            </div>
                        );
                    })}
                </div>

                <div className="actions">
                    <button type="button" className="secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>
                </div>
            </form>
        </div>
    );
}
