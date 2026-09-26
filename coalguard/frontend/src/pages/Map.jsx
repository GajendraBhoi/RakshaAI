import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../lib/api';

// Fix Leaflet's default icon issue with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored icons based on severity
const getIcon = (severity) => {
  const color = severity === 'Critical' || severity === 'High' ? 'red' :
                severity === 'Medium' ? 'orange' : 'green';
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export default function GISMap() {
  const [observations, setObservations] = useState([]);
  // Center roughly on India where the mock data is
  const [center] = useState([23.0, 84.0]);

  useEffect(() => {
    // In a real app, we'd fetch actual observations from /gis/observations
    // For demo, we'll use a mocked list
    setObservations([
      { id: 1, lat: 23.75, lon: 86.42, severity: 'Critical', desc: 'Dust suppression system offline', inspector: 'Insp C' },
      { id: 2, lat: 22.35, lon: 82.68, severity: 'Low', desc: 'Routine check complete', inspector: 'Insp A' },
      { id: 3, lat: 24.20, lon: 82.66, severity: 'Medium', desc: 'Minor fencing damage', inspector: 'Insp B' }
    ]);
  }, []);

  return (
    <div className="container">
      <h1 className="text-3xl mb-6">GIS Evidence Map</h1>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden', height: '600px' }}>
        <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {observations.map((obs) => (
            <Marker key={obs.id} position={[obs.lat, obs.lon]} icon={getIcon(obs.severity)}>
              <Popup>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 'bold' }}>{obs.severity} Severity</h3>
                  <p style={{ margin: '0 0 4px', fontSize: '12px' }}>{obs.desc}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>Reported by: {obs.inspector}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
