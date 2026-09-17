import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem('fmf_admin_auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');

  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('Active & Live');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    loadClients();
    const poll = setInterval(loadClients, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        setEditName(client.name || '');
        setEditStatus(client.status || 'Active & Live');
        setEditDesc(client.description || '');
      }
    }
  }, [selectedClientId, clients]);

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { data } = await supabase.from('config').select('value').eq('key', 'admin_password').maybeSingle();
    if (data && passwordInput === data.value) {
      setAuthenticated(true);
      localStorage.setItem('fmf_admin_auth', 'true');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const addClient = async (e) => {
    e.preventDefault();
    if (!newSlug.trim() || !newName.trim()) return;
    const slug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const { error } = await supabase.from('clients').insert({
      slug,
      name: newName.trim(),
      status: 'Active & Live',
    });
    if (!error) {
      setNewSlug('');
      setNewName('');
      setShowAddForm(false);
      loadClients();
    }
  };

  const deleteClient = async (id) => {
    await supabase.from('clients').delete().eq('id', id);
    if (selectedClientId === id) setSelectedClientId(null);
    loadClients();
  };

  const updateClient = async (fields) => {
    if (!selectedClientId) return;
    await supabase.from('clients').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', selectedClientId);
    loadClients();
  };

  const handleNameBlur = () => updateClient({ name: editName });
  const handleStatusChange = (s) => { setEditStatus(s); updateClient({ status: s }); };
  const handleDescBlur = () => updateClient({ description: editDesc });

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', width: 360 }} className="login-card">
          <h3 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>Admin Login</h3>
          <form onSubmit={handlePasswordSubmit}>
            <input type="password" placeholder="Enter admin password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required autoFocus style={{ width: '100%', padding: '12px 16px', fontSize: 15, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box', marginBottom: 16 }} />
            {passwordError && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 12 }}>{passwordError}</p>}
            <button type="submit" style={{ width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Enter</button>
          </form>
        </div>
      </div>
    );
  }

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: '#1a73e8', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>&#128205;</span>
          Find My Friends — Admin
        </h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/" style={{ color: 'white', fontSize: 12, textDecoration: 'none', opacity: 0.8 }}>Map</a>
          <button onClick={() => { setAuthenticated(false); localStorage.removeItem('fmf_admin_auth'); setPasswordInput(''); setSelectedClientId(null); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Lock</button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '24px auto', padding: '0 20px', display: 'flex', gap: 20 }} className="admin-main">
        <div style={{ width: 280, flexShrink: 0 }} className="admin-sidebar">
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Friends ({clients.length})</span>
              <button onClick={() => setShowAddForm(!showAddForm)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: 'none', background: '#1a73e8', color: 'white', cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
            </div>

            {showAddForm && (
              <div style={{ padding: 12, borderBottom: '1px solid #eee', background: '#fafafa' }}>
                <form onSubmit={addClient}>
                  <input type="text" placeholder="Slug (e.g. john)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box', marginBottom: 6 }} />
                  <input type="text" placeholder="Display Name" value={newName} onChange={(e) => setNewName(e.target.value)} required style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box', marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="submit" style={{ flex: 1, padding: '6px 0', fontSize: 13, fontWeight: 600, background: '#0d652d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create</button>
                    <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '6px 12px', fontSize: 13, background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ maxHeight: 500, overflowY: 'auto' }} className="client-list">
              {clients.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>No friends yet</div>
              )}
              {clients.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: selectedClientId === c.id ? '#e8f0fe' : 'white', transition: 'background 0.15s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a73e8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {(c.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>/{c.slug}</div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteClient(c.id); }} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid #ddd', background: '#ffebee', color: '#c62828', cursor: 'pointer' }}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }} className="admin-editor">
          {!selectedClient ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>&#128100;</div>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Select a Friend</h3>
              <p style={{ color: '#666', fontSize: 14 }}>Choose from the list or add a new friend.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a73e8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                    {(selectedClient.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>{selectedClient.name}</h3>
                    <span style={{ fontSize: 12, color: '#888' }}>/{selectedClient.slug} &middot; <a href={`/${selectedClient.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8' }}>Open Panel</a></span>
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: selectedClient.status === 'Offline' ? '#c62828' : '#0d652d', color: 'white' }}>{selectedClient.status}</span>
              </div>

              <div style={{ padding: 20 }} className="editor-body">
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleNameBlur} style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Status</label>
                  <select value={editStatus} onChange={(e) => handleStatusChange(e.target.value)} style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box', background: 'white' }}>
                    <option value="Active & Live">Active & Live</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea placeholder="Note..." value={editDesc} onChange={(e) => setEditDesc(e.target.value)} onBlur={handleDescBlur} rows={2} style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box', resize: 'none' }} />
                </div>

                <div style={{ padding: '12px 16px', background: '#f0f7ff', borderRadius: 8, borderLeft: '3px solid #1a73e8' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#333' }}>
                    Share this link with <strong>{selectedClient.name}</strong>:
                  </p>
                  <code style={{ display: 'block', marginTop: 6, padding: '6px 10px', background: 'white', borderRadius: 4, fontSize: 12, wordBreak: 'break-all' }}>
                    {window.location.origin}/{selectedClient.slug}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
