import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import MapView from '../components/MapView';

export default function GlobalView() {
  const [clients, setClients] = useState([]);
  const [connected, setConnected] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [slugError, setSlugError] = useState('');

  const loadClients = useCallback(async () => {
    const { data, error } = await supabase.from('clients').select('*');
    if (!error && data) setClients(data);
  }, []);

  useEffect(() => {
    loadClients();
    const channel = supabase
      .channel('global-clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => loadClients())
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));
    const poll = setInterval(loadClients, 3000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [loadClients]);

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    const slug = slugInput.trim().toLowerCase();
    if (!slug) return;
    const { data } = await supabase.from('clients').select('slug').eq('slug', slug).maybeSingle();
    if (data) {
      window.location.href = `/${slug}`;
    } else {
      setSlugError('Client not found');
    }
  };

  const activeClients = clients.filter((c) => c.lat != null && c.lng != null && c.status !== 'Offline');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1a73e8', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, position: 'relative', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>&#128205;</span>
          Find My Friends
        </h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, opacity: 0.9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#4caf50' : '#f44336', animation: connected ? 'pulse 1.5s infinite' : 'none' }} />
            {activeClients.length} online
          </span>
          <button onClick={() => { setShowShare(true); setSlugInput(''); setSlugError(''); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Share</button>
        </div>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapView clients={activeClients} height="100%" showSatelliteToggle />
      </div>

      {showShare && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowShare(false)}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: '90%', maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>Enter Client Code</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>Enter your friend's code to share your location.</p>
            <form onSubmit={handleShareSubmit}>
              <input
                type="text"
                placeholder="e.g. john"
                value={slugInput}
                onChange={(e) => { setSlugInput(e.target.value); setSlugError(''); }}
                autoFocus
                style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box', marginBottom: 10 }}
              />
              {slugError && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 10 }}>{slugError}</p>}
              <button type="submit" style={{ width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Go</button>
            </form>
            <button onClick={() => setShowShare(false)} style={{ width: '100%', marginTop: 8, padding: '10px 0', fontSize: 13, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
