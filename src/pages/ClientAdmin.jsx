import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MapView from '../components/MapView';

export default function ClientAdmin() {
  const { slug } = useParams();
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [geoError, setGeoError] = useState('');
  const watchIdRef = useRef(null);

  const fetchClient = async () => {
    const { data } = await supabase.from('clients').select('*').eq('slug', slug).maybeSingle();
    if (data) { setClient(data); setNotFound(false); } else { setNotFound(true); }
    setLoading(false);
  };

  const loadClients = useCallback(async () => {
    const { data } = await supabase.from('clients').select('*');
    if (data) setClients(data);
  }, []);

  useEffect(() => {
    fetchClient();
    loadClients();
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [slug]);

  useEffect(() => {
    const channel = supabase
      .channel(`client-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `slug=eq.${slug}` }, (payload) => {
        if (payload.eventType === 'UPDATE') setClient(payload.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => loadClients())
      .subscribe();
    const poll = setInterval(() => { fetchClient(); loadClients(); }, 5000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [slug]);

  const startSharing = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return; }
    setSharing(true);
    setGeoError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const { error } = await supabase.from('clients').update({ lat, lng, updated_at: new Date().toISOString() }).eq('slug', slug);
        if (error) console.error('Update failed:', error);
      },
      (err) => { setGeoError(err.message); setSharing(false); },
      { enableHighAccuracy: true, maximumAge: 0, distanceFilter: 1 }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setSharing(false);
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#888' }}>Loading...</p></div>;

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#128269;</div>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Not Found</h3>
        <p style={{ color: '#666', fontSize: 14 }}>No friend found for "{slug}".</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 12, padding: '10px 20px', background: '#1a73e8', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>Back to Map</a>
      </div>
    </div>
  );

  const now = Date.now();
  const activeClients = clients.filter((c) => {
    if (c.lat == null || c.lng == null || c.status === 'Offline') return false;
    if (!c.updated_at) return false;
    const elapsed = now - new Date(c.updated_at).getTime();
    return elapsed < 30000;
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1a73e8', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, position: 'relative', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
            {(client?.name || '?')[0].toUpperCase()}
          </div>
          {client?.name || slug}
        </h2>

      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapView clients={activeClients} height="100%" showSatelliteToggle />

        {/* Floating control panel */}
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'white', borderRadius: 14, padding: '16px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 1000,
          minWidth: 260, maxWidth: '90%',
        }}>
          {geoError && <p style={{ color: '#c62828', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{geoError}</p>}

          <button
            onClick={sharing ? stopSharing : startSharing}
            style={{
              width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600,
              border: 'none', borderRadius: 8, cursor: 'pointer',
              background: sharing ? '#c62828' : '#1a73e8', color: 'white',
            }}
          >
            {sharing ? 'Stop GPS Location' : 'Share My Location'}
          </button>

          {sharing && (
            <>
              <p style={{ marginTop: 8, fontSize: 12, color: '#0d652d', textAlign: 'center' }}>
                Sharing live GPS...
              </p>
              <p style={{ marginTop: 6, fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 1.4 }}>
                Sharing stops if the app is removed from background.<br />Press the Home button to minimize.
              </p>
            </>
          )}

          {client?.lat != null && client?.lng != null && (
            <p style={{ marginTop: 6, fontSize: 11, color: '#aaa', textAlign: 'center' }}>
              {client.lat.toFixed(5)}, {client.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
