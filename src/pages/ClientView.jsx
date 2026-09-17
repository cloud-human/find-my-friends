import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MapView from '../components/MapView';

const statusColors = {
  'Active & Live': '#2e7d32',
  'Active & Idle': '#f57f17',
  'Active & In-transit': '#1565c0',
  'Offline': '#c62828',
};

export default function ClientView() {
  const { slug } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchClient();

    const channel = supabase
      .channel(`client-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `slug=eq.${slug}` }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setClient(payload.new);
        }
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    const poll = setInterval(fetchClient, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [slug]);

  const fetchClient = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (data) {
      setClient(data);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
    setLoading(false);
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
          <p style={{ color: '#666', fontSize: 14 }}>No tracking session found for "{slug}".</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: '#D4A017', color: '#333', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/batman-logo.png" alt="Batman" style={{ height: 28, width: 28, objectFit: 'contain' }} />
          {client?.name || slug}
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: client?.status === 'Offline' ? 'rgba(198,40,40,0.25)' : connected ? 'rgba(46,125,50,0.25)' : 'rgba(255,255,255,0.15)', color: client?.status === 'Offline' ? '#ef9a9a' : connected ? '#2e7d32' : '#aaa' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: client?.status === 'Offline' ? '#c62828' : connected ? '#2e7d32' : '#888', animation: client?.status !== 'Offline' && connected ? 'pulse 1.5s infinite' : 'none' }} />
            {client?.status === 'Offline' ? 'OFFLINE' : 'LIVE'}
          </span>
          {client && (
            <span style={{ padding: '4px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: statusColors[client.status] || '#666', color: 'white' }}>
              {client.status}
            </span>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '16px' }}>
        {client && client.lat != null && client.lng != null ? (
          <div style={{ background: 'white', borderRadius: 0, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {client.status === 'Offline' ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>&#128269;</div>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>No Live Location Available</h3>
                <p style={{ color: '#666', fontSize: 14 }}>The location is currently offline.</p>
              </div>
            ) : (
              <>
                <MapView lat={client.lat} lng={client.lng} status={client.status} height="50vh" showSatelliteToggle callSign={client.call_sign} vehicleType={client.vehicle_type} />
                <div style={{ padding: '16px 20px' }}>
                  {client.description && (
                    <div style={{ marginBottom: 14, padding: '12px 16px', background: '#f9f9f9', borderRadius: 8, borderLeft: '3px solid #D4A017' }}>
                      <p style={{ margin: 0, fontSize: 14, color: '#333', lineHeight: 1.5 }}>{client.description}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                      {client.lat.toFixed(5)}, {client.lng.toFixed(5)}
                    </p>
                    <a
                      href={client.url || `https://www.google.com/maps?q=${client.lat},${client.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-block', padding: '10px 24px', fontSize: 14, fontWeight: 600, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, textDecoration: 'none', cursor: 'pointer', flex: '1 1 auto', textAlign: 'center' }}
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 12, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#128269;</div>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>No Location Yet</h3>
            <p style={{ color: '#666', fontSize: 14 }}>Waiting for a location to be shared...</p>
          </div>
        )}
      </main>
    </div>
  );
}
