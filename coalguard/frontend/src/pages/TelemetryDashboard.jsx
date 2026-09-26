import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Flame,
  Gauge,
  ShieldCheck,
  Wind,
  Zap,
} from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../lib/api';

const assetId = 'conveyor-07';
const faultLabels = {
  'bearing-thermal-surge': 'Bearing thermal surge',
  'methane-leak': 'Methane leak',
  'worker-zone-intrusion': 'Worker zone intrusion',
};

function toChartPoint(event) {
  const asset = event.assets?.find((item) => item.asset_id === assetId) || event.assets?.[0];
  if (!asset) return null;
  return {
    time: new Date(event.generated_at).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
    methane: asset.values.methane_ch4,
    temperature: asset.values.bearing_temperature,
    vibration: asset.values.vibration,
    dust: asset.values.dust,
    co: asset.values.co_ppm,
  };
}

export default function TelemetryDashboard() {
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [faults, setFaults] = useState({});
  const [rul, setRul] = useState(null);
  const [rulHistory, setRulHistory] = useState([]);
  const [cvIncidents, setCvIncidents] = useState([]);
  const [connection, setConnection] = useState('connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    let socket;
    let cancelled = false;
    let reconnectTimer;
    let reconnectDelay = 1000;

    const loadPrediction = async (currentAsset) => {
      try {
        const response = await api.post('/api/ml/predict-rul', {
          asset_id: currentAsset.asset_id,
          sensor_values: currentAsset.values,
        });
        if (cancelled) return;
        setRul(response.data);
        setRulHistory((points) => [...points, {
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          health: response.data.health_index,
          rul: response.data.rul_hours,
        }].slice(-24));
      } catch {
        if (!cancelled) setError('RUL engine is unavailable. Raw telemetry remains live.');
      }
    };

    const loadInitialState = async () => {
      try {
        const [snapshotResponse, historyResponse] = await Promise.all([
          api.get('/telemetry/snapshot'),
          api.get('/telemetry/history?limit=24'),
        ]);
        if (cancelled) return;
        const current = snapshotResponse.data.assets.find((item) => item.asset_id === assetId) || snapshotResponse.data.assets[0];
        setAsset(current);
        setFaults(snapshotResponse.data.faults || {});
        setHistory(historyResponse.data.items.map(toChartPoint).filter(Boolean));
        const incidentResponse = await api.get('/api/alerts/cv-incidents');
        setCvIncidents(incidentResponse.data.items || []);
        await loadPrediction(current);
      } catch {
        if (!cancelled) setError('Telemetry API is unavailable. Start the backend to enable live data.');
      }
    };

    const connect = () => {
      const wsUrl = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/telemetry`;
      socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        if (!cancelled) { setConnection('live'); reconnectDelay = 1000; }
      };
      socket.onmessage = (message) => {
        let event;
        try { event = JSON.parse(message.data); } catch { return; }
        if (cancelled) return;
        if (event.type === 'fault_state') {
          setFaults(event.faults || {});
          return;
        }
        if (event.type === 'cv_incident') {
          setCvIncidents((items) => [event.incident, ...items.filter((item) => item.id !== event.incident.id)].slice(0, 6));
          return;
        }
        const current = event.assets?.find((item) => item.asset_id === assetId) || event.assets?.[0];
        if (!current) return;
        setAsset(current);
        loadPrediction(current);
        const point = toChartPoint(event);
        if (point) setHistory((points) => [...points, point].slice(-24));
      };
      socket.onerror = () => {
        if (!cancelled) setConnection('offline');
      };
      socket.onclose = () => {
        if (!cancelled) { setConnection('offline'); reconnectTimer = window.setTimeout(connect, reconnectDelay); reconnectDelay = Math.min(reconnectDelay * 2, 10000); }
      };
    };

    loadInitialState();
    connect();
    return () => {
      cancelled = true;
      socket?.close();
      window.clearTimeout(reconnectTimer);
    };
  }, []);

  const activeHazards = asset?.hazards || [];
  const chartData = useMemo(() => history.length ? history : [{ time: '--', methane: 0, temperature: 0, vibration: 0, dust: 0, co: 0 }], [history]);
  const rulData = useMemo(() => rulHistory.length ? rulHistory : [{ time: '--', health: 0, rul: 0 }], [rulHistory]);

  const statCards = useMemo(() => [
    {
      label: 'Methane (CH4)',
      value: asset?.values?.methane_ch4 ?? 0.45,
      unit: '%',
      delta: '+12%',
      tone: 'green',
      icon: Flame,
      limit: 'Limit: 1.25% (DGMS)',
      status: 'Normal',
    },
    {
      label: 'Carbon Monoxide (CO)',
      value: asset?.values?.co_ppm ?? 12,
      unit: 'ppm',
      delta: '+8%',
      tone: 'amber',
      icon: Wind,
      limit: 'Limit: 50 ppm',
      status: 'Normal',
    },
    {
      label: 'Bearing Temperature',
      value: asset?.values?.bearing_temperature ?? 68,
      unit: '°C',
      delta: '+5%',
      tone: 'orange',
      icon: Gauge,
      limit: 'Limit: 80°C',
      status: 'Warning',
    },
    {
      label: 'Vibration (RMS)',
      value: asset?.values?.vibration ?? 4.2,
      unit: 'mm/s',
      delta: '+10%',
      tone: 'violet',
      icon: Activity,
      limit: 'Limit: 7.1 mm/s',
      status: 'Normal',
    },
    {
      label: 'Air Velocity',
      value: 2.8,
      unit: 'm/s',
      delta: '+3%',
      tone: 'cyan',
      icon: Zap,
      limit: 'Limit: 10.0 m/s',
      status: 'Normal',
    },
    {
      label: 'Coal Dust',
      value: 12,
      unit: 'mg/m³',
      delta: '+15%',
      tone: 'red',
      icon: ShieldCheck,
      limit: 'Limit: 30 mg/m³',
      status: 'Normal',
    },
  ], [asset]);

  const sensorNodes = [
    { name: 'Node 01', signal: '-67 dBm', value: '92%', tone: 'green' },
    { name: 'Node 02', signal: '-72 dBm', value: '88%', tone: 'green' },
    { name: 'Node 03', signal: '-65 dBm', value: '95%', tone: 'green' },
    { name: 'Node 04', signal: '-70 dBm', value: '90%', tone: 'green' },
    { name: 'Node 05', signal: '-68 dBm', value: '87%', tone: 'green' },
  ];

  const liveEvents = activeHazards.length ? activeHazards.map((hazard) => ({
    id: hazard.code,
    title: hazard.message,
    severity: hazard.severity || 'medium',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })) : [
    { id: 'safe-1', title: 'All parameters within normal range', severity: 'normal', time: '11:36:09' },
    { id: 'safe-2', title: 'Dust level increased (22 mg/m³)', severity: 'medium', time: '11:32:01' },
  ];

  const quickActions = [
    { label: 'Export raw logs', description: 'Download CSV telemetry data', tone: 'green' },
    { label: 'Auto-fill DGMS register', description: 'Generate statutory format', tone: 'blue' },
    { label: 'View equipment details', description: 'See asset information & history', tone: 'purple' },
    { label: 'Create maintenance ticket', description: 'Raise corrective action', tone: 'orange' },
  ];

  const toggleFault = async (faultType) => {
    const enabled = !faults[faultType];
    try {
      const response = await api.post(`/telemetry/faults/${faultType}`, { enabled });
      setFaults(response.data);
      setError('');
    } catch {
      setError('Unable to change the demo fault state.');
    }
  };

  return (
    <main className="telemetry-page">
      <div className="telemetry-header-row">
        <div className="telemetry-header-copy">
          <p className="eyebrow muted">Telemetry Monitoring</p>
          <h1>Telemetry Monitoring</h1>
          <p className="telemetry-subtitle">Real-time sensor data • Equipment health • Predictive maintenance</p>
        </div>
        <div className="telemetry-top-actions">
          <div className="toolbar-chip toolbar-select">
            <span className="toolbar-label"><Activity size={14} /></span>
            <span>Geva Mine • Chhattisgarh</span>
            <ChevronDown size={14} />
          </div>
          <div className="toolbar-chip toolbar-date">
            <span className="toolbar-label"><CalendarDays size={14} /></span>
            <span>01 Sep 2026 - 30 Sep 2026</span>
            <ChevronDown size={14} />
          </div>
          <div className="toolbar-icon-button">
            <Bell size={16} />
            <span className="toolbar-badge">3</span>
          </div>
          <div className="toolbar-user">
            <div className="toolbar-avatar">G</div>
            <div>
              <strong>Gajendra B.</strong>
              <span>Mine Official</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="inline-error" role="alert">{error}</div>}

      <section className="telemetry-stat-grid" aria-label="Live sensor summary">
        {statCards.map(({ label, value, unit, delta, tone, icon: Icon, limit, status }) => (
          <article className={`telemetry-stat-card tone-${tone}`} key={label}>
            <div className="stat-card-icon"><Icon size={20} /></div>
            <div className="stat-card-main">
              <div className="stat-card-header">
                <span>{label}</span>
                <span className="stat-card-value-badge">{status}</span>
              </div>
              <div className="stat-card-value-row">
                <strong>{value}</strong>
                <small>{unit}</small>
                <span className="jump-pill">{delta}</span>
              </div>
              <div className="stat-card-footer">
                <span>{limit}</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="telemetry-main-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Live Sensor Data</p>
              <h2>{asset?.name || 'Conveyor 07'} signal history</h2>
            </div>
            <div className="chart-range-buttons">
              {['1H', '12H', '24H', '72H'].map((item, index) => (
                <button key={item} type="button" className={index === 0 ? 'active' : ''}>{item}</button>
              ))}
            </div>
          </div>

          <div className="chart-legend">
            <span><i className="legend-swatch methane" /> Methane (CH4)</span>
            <span><i className="legend-swatch co" /> CO (ppm)</span>
            <span><i className="legend-swatch temperature" /> Temperature (°C)</span>
            <span><i className="legend-swatch vibration" /> Vibration (mm/s)</span>
          </div>

          <div className="telemetry-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="methane" stroke="#2ba27e" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="co" stroke="#ef7e4a" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="temperature" stroke="#f3b23f" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="vibration" stroke="#5d7bf9" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel health-panel">
          <div className="panel-header small-gap">
            <div>
              <p className="panel-kicker">Equipment Health & Prediction</p>
              <h2>Sensor Nodes Status</h2>
            </div>
            <button type="button" className="panel-link">View all <ArrowRight size={14} /></button>
          </div>

          <div className="sensor-health-box">
            <div className="health-ring" style={{ '--health': `${Math.max(0, Math.min(100, rul?.health_index ?? 82))}%` }}>
              <div className="ring-center">
                <strong>{rul?.health_index ?? 82}%</strong>
                <span>Health Index</span>
              </div>
            </div>
            <div className="health-metrics">
              <div>
                <span>Predicted RUL</span>
                <strong>{rul?.rul_hours ?? 142} hrs</strong>
              </div>
              <div>
                <span>Failure Probability</span>
                <strong>{rul ? `${Math.round(rul.failure_probability * 100)}%` : '18%'}</strong>
              </div>
            </div>
          </div>

          <div className="health-status-row">
            <div className="status-badge success"><CheckCircle2 size={13} /> Model confidence</div>
            <strong>{rul ? `${Math.round(rul.confidence * 100)}%` : '92%'}</strong>
          </div>

          <div className="sensor-node-list">
            {sensorNodes.map((node) => (
              <div className="sensor-node-item" key={node.name}>
                <div className="sensor-node-title">
                  <div className={`node-dot ${node.tone}`} />
                  <span>{node.name}</span>
                </div>
                <div className="sensor-node-state">
                  <span className="online-pill"><span className="pill-dot" /> Online</span>
                  <span>{node.signal}</span>
                  <strong>{node.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="telemetry-lower-grid">
        <div className="panel live-events-panel">
          <div className="panel-header small-gap">
            <div>
              <p className="panel-kicker">Live Alerts & Events</p>
              <h2>Live Alerts & Events</h2>
            </div>
            <button type="button" className="panel-link">View all <ArrowRight size={14} /></button>
          </div>

          <div className="event-list">
            {liveEvents.map((event) => (
              <div className={`event-item ${event.severity}`} key={event.id}>
                <span className="event-icon"><AlertTriangle size={14} /></span>
                <div className="event-copy">
                  <div className="event-topline">
                    <strong>{event.time}</strong>
                    <span className={`severity-pill ${event.severity}`}>{event.severity === 'normal' ? 'Normal' : event.severity === 'medium' ? 'Medium' : 'High'}</span>
                  </div>
                  <p>{event.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel fault-panel">
          <div className="panel-header small-gap">
            <div>
              <p className="panel-kicker">Demo Mode</p>
              <h2>Fault Injection</h2>
            </div>
            <button type="button" className="panel-link danger">Reset all</button>
          </div>

          <div className="fault-grid">
            {Object.entries(faultLabels).map(([faultType, label]) => (
              <button className={`fault-button ${faults[faultType] ? 'fault-active' : ''}`} key={faultType} onClick={() => toggleFault(faultType)}>
                <span className="fault-indicator" />
                <span>{faults[faultType] ? `Clear ${label}` : `Inject ${label}`}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel actions-panel">
          <div className="panel-header small-gap">
            <div>
              <p className="panel-kicker">Quick Actions</p>
              <h2>Fast track</h2>
            </div>
          </div>

          <div className="action-list">
            {quickActions.map(({ label, description, tone }) => (
              <button type="button" className={`action-item tone-${tone}`} key={label}>
                <span className="action-icon" aria-hidden="true">•</span>
                <span className="action-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
