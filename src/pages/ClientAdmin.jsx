import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MapView from '../components/MapView';

export default function ClientAdmin() {
  const { slug } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [geoError, setGeoError] = useState('');
  const watchIdRef = useRef(null);

  useEffect(() => {
    fetchClient();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [slug]);

  useEffect(() => {
    const channel = supabase
      .channel(`client-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `slug=eq.${slug}` }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setClient(payload.new);
        }
      })
      .subscribe();

    const poll = setInterval(fetchClient, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [slug]);

  const fetchClient = async () => {
    const { data } = await supabase.from('clients').select('*').eq('slug', slug).maybeSingle();
    if (data) {
      setClient(data);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const startSharing = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return; }
    setSharing(true);
    setGeoError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        supabase.from('clients').update({ lat, lng, updated_at: new Date().toISOString() }).eq('slug', slug);
      },
      (err) => { setGeoError(err.message); setSharing(false); },
      { enableHighAccuracy: true, maximumAge: 0, distanceFilter: 1 }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setSharing(false);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#128269;</div>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Not Found</h3>
          <p style={{ color: '#666', fontSize: 14 }}>No friend found for "{slug}".</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: '#1a73e8', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
            {(client?.name || '?')[0].toUpperCase()}
          </div>
          {client?.name || slug}
        </h2>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '4px 10px', borderRadius: 12, background: sharing ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.15)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sharing ? '#4caf50' : '#f44336', animation: sharing ? 'pulse 1.5s infinite' : 'none' }} />
          {sharing ? 'SHARING' : 'OFFLINE'}
        </span>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {client?.lat != null && client?.lng != null && (
            <div style={{ borderBottom: '1px solid #eee' }}>
              <MapView lat={client.lat} lng={client.lng} height="300px" single showSatelliteToggle />
            </div>
          )}

          <div style={{ padding: 20 }}>
            {geoError && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 12 }}>{geoError}</p>}

            <button
              onClick={sharing ? stopSharing : startSharing}
              style={{
                width: '100%', padding: '14px 0', fontSize: 16, fontWeight: 600,
                border: 'none', borderRadius: 10, cursor: 'pointer',
                background: sharing ? '#c62828' : '#1a73e8',
                color: 'white',
              }}
            >
              {sharing ? 'Stop Sharing Location' : 'Share My Location'}
            </button>

            {sharing && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#0d652d', textAlign: 'center' }}>
                Your location is being shared in real-time.
              </p>
            )}

            {client?.lat != null && client?.lng != null && (
              <p style={{ marginTop: 12, fontSize: 12, color: '#888', textAlign: 'center' }}>
                {client.lat.toFixed(5)}, {client.lng.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
