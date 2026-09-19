import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

const streetLayer = { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' };
const satelliteLayer = { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' };

const circleColors = [
  '#1a73e8', '#e8710a', '#d93025', '#0d652d', '#7b1fa2',
  '#c2185b', '#00838f', '#f57f17', '#4527a0', '#1565c0',
];

function getColor(id) {
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return circleColors[Math.abs(hash) % circleColors.length];
}

function ClickHandler({ onPositionChange }) {
  useMapEvents({
    click(e) {
      if (onPositionChange) onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function UserMarker({ client, color, editable, onPositionChange }) {
  const letter = (client.name || client.slug || '?')[0].toUpperCase();
  const stale = client.updated_at ? (Date.now() - new Date(client.updated_at).getTime()) > 10000 : false;

  const markerIcon = L.divIcon({
    className: '',
    html: `<div style="
      width: 36px; height: 36px; border-radius: 50%;
      background: ${color}; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; font-family: -apple-system, sans-serif;
      border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: ${editable ? 'grab' : 'default'};
      ${stale ? 'opacity: 0.5;' : ''}
    ">${letter}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });

  const formatLastSeen = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const now = new Date();
    const d = new Date(ts);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
    return `${d.toLocaleDateString()} ${time}`;
  };

  return (
    <Marker
      position={[client.lat, client.lng]}
      icon={markerIcon}
      draggable={editable}
      eventHandlers={editable ? {
        dragend(e) {
          if (onPositionChange) {
            const { lat: newLat, lng: newLng } = e.target.getLatLng();
            onPositionChange(newLat, newLng);
          }
        },
      } : undefined}
    >
      <Popup maxWidth={220} minWidth={180}>
        <div style={{ padding: '10px 12px', fontFamily: '-apple-system, sans-serif' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#333', marginBottom: 4 }}>{client.name}</div>
          {stale && client.updated_at && (
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              Last Seen - {formatLastSeen(client.updated_at)}
            </div>
          )}
          {client.description && <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{client.description}</div>}
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView({
  clients = [],
  lat, lng, height = '100vh',
  editable = false, onPositionChange,
  showSatelliteToggle = false,
  single = false,
}) {
  const [satellite, setSatellite] = useState(false);
  const layer = satellite ? satelliteLayer : streetLayer;

  if (single && (lat == null || lng == null)) return null;

  const center = single ? [lat, lng] : [20.5937, 78.9629];
  const zoom = single ? 15 : 5;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer key={satellite ? 'sat' : 'street'} url={layer.url} attribution={layer.attribution} />
        {editable && single && <ClickHandler onPositionChange={onPositionChange} />}
        {single && <Recenter lat={lat} lng={lng} />}

        {single ? (
          <UserMarker
            client={{ name: 'You', slug: 'you', lat, lng }}
            color="#1a73e8"
            editable={editable}
            onPositionChange={onPositionChange}
          />
        ) : (
          clients.map((c, i) => (
            c.lat != null && c.lng != null && (
              <UserMarker
                key={c.id}
                client={c}
                color={getColor(c.id)}
              />
            )
          ))
        )}
      </MapContainer>

      {showSatelliteToggle && (
        <button
          onClick={() => setSatellite(!satellite)}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1000,
            padding: '6px 12px', fontSize: 12, fontWeight: 600,
            background: satellite ? '#1a73e8' : 'white',
            color: satellite ? 'white' : '#333',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          {satellite ? 'Street' : 'Satellite'}
        </button>
      )}
    </div>
  );
}
