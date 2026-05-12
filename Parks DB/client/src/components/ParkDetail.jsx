// Park detail card. Floats over the top-right of the map.
import { useAuth } from '../auth.jsx';

export function ParkDetail({ park, onClose, onEdit }) {
    const { user } = useAuth();
    return (
        <div className="detail">
            <button className="close-x" onClick={onClose} aria-label="Close">✕</button>
            <h2>{park.name}</h2>
            {(park.address || park.city) && (
                <div className="address">
                    {[park.address, park.city, park.region].filter(Boolean).join(', ')}
                </div>
            )}
            {park.description && <p>{park.description}</p>}
            {park.features?.length > 0 && (() => {
                const types  = park.features.filter((f) => f.kind === 'park_type');
                const others = park.features.filter((f) => f.kind !== 'park_type');
                return (
                    <>
                        {types.length > 0 && (
                            <div className="features" style={{ marginTop: 8 }}>
                                {types.map((f) => (
                                    <span key={f.id} className="chip chip-type">{f.name}</span>
                                ))}
                            </div>
                        )}
                        {others.length > 0 && (
                            <>
                                <div style={{ fontWeight: 600, marginTop: 8 }}>Features</div>
                                <div className="features">
                                    {others.map((f) => (
                                        <span key={f.id} className="chip">{f.name}</span>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                );
            })()}
            {user && (
                <div style={{ marginTop: 12 }}>
                    <button className="secondary" onClick={() => onEdit(park)}>
                        Suggest an edit
                    </button>
                </div>
            )}
        </div>
    );
}
