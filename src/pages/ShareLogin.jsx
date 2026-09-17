import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ShareLogin() {
  const [slugInput, setSlugInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fmf_client_slug');
    if (saved) {
      window.location.href = `/${saved}`;
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const slug = slugInput.trim().toLowerCase();
    if (!slug) return;
    setLoading(true);
    setError('');
    const { data } = await supabase.from('clients').select('slug').eq('slug', slug).maybeSingle();
    setLoading(false);
    if (data) {
      localStorage.setItem('fmf_client_slug', slug);
      window.location.href = `/${slug}`;
    } else {
      setError('Client not found');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 36, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: '90%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>&#128205;</div>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#333' }}>Find My Friends</h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#888' }}>Enter your client code to share your location</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Client code (e.g. john)"
            value={slugInput}
            onChange={(e) => { setSlugInput(e.target.value); setError(''); }}
            autoFocus
            style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '1px solid #ddd', borderRadius: 10, boxSizing: 'border-box', marginBottom: 12, textAlign: 'center' }}
          />
          {error && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 600, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </form>

      </div>
    </div>
  );
}
