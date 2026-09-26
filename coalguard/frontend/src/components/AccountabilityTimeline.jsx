import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AccountabilityTimeline({ actionId }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (actionId) {
      api.get(`/corrective-actions/${actionId}/timeline`)
        .then(res => setEvents(res.data))
        .catch(console.error);
    }
  }, [actionId]);

  if (!events.length) return <p className="text-muted">No timeline events found.</p>;

  return (
    <div className="timeline-container" style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-color)' }}>
      {events.map((event, idx) => (
        <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <div style={{
            position: 'absolute',
            left: '-1.4rem',
            top: '0.25rem',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: event.action === 'VERIFIED_CLOSED' ? 'var(--success)' : 'var(--primary)'
          }}></div>
          <div style={{ paddingLeft: '1rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{event.action}</p>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {new Date(event.created_at).toLocaleString()} | Actor: {event.actor_id}
            </p>
            {event.after_json && (
              <pre style={{ 
                background: '#f1f5f9', 
                padding: '0.5rem', 
                borderRadius: '4px', 
                fontSize: '0.75rem',
                marginTop: '0.5rem' 
              }}>
                {JSON.stringify(event.after_json, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
