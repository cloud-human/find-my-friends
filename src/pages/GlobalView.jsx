import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MapView from '../components/MapView';

export default function GlobalView() {
  const [clients, setClients] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    loadClients();

    const channel = supabase
      .channel('global-clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        loadClients();
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    const poll = setInterval(loadClients, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('*');
    setClients(data || []);
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
          <a href="/admin" style={{ color: 'white', fontSize: 12, textDecoration: 'none', opacity: 0.8 }}>Admin</a>
        </div>
      </header>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView clients={activeClients} height="100%" />
      </div>
    </div>
  );
}
