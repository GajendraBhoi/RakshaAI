import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  ChevronDown,
  Crosshair,
  Layers3,
  MapPin,
  Maximize2,
  Radio,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import api from '../lib/api';

const sensorLabels = {
  methane_ch4: ['Methane CH₄', '%'],
  co_ppm: ['Carbon monoxide', 'ppm'],
  bearing_temperature: ['Bearing temperature', '°C'],
  vibration: ['Vibration RMS', 'mm/s'],
  dust: ['Coal dust', 'mg/m³'],
};

function statusClass(status) {
  return status === 'red' ? 'twin-status-danger' : status === 'yellow' ? 'twin-status-watch' : 'twin-status-good';
}

export default function DigitalTwin() {
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [activeLayer, setActiveLayer] = useState('Everything');
  const [showLabels, setShowLabels] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get('/api/digital-twin/state');
        if (!cancelled) { setState(response.data); setLastSync(new Date()); setError(''); }
      } catch {
        if (!cancelled) setError('Digital twin service is unavailable.');
      }
    };
    load();
    const timer = window.setInterval(load, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const assets = state?.assets || [];
  const workers = state?.workers || [];
  const zones = state?.zones || [];
  const hazardCount = assets.reduce((total, asset) => total + asset.hazards.length, 0);
  const selectedZone = selected ? zones.find((zone) => zone.id === selected.zone) : null;
  const selectedStatus = selected ? statusClass(selected.status) : '';
  const mapItems = useMemo(() => ({
    Everything: true,
    Equipment: activeLayer === 'Everything' || activeLayer === 'Equipment',
    People: activeLayer === 'Everything' || activeLayer === 'People',
    'Risk zones': activeLayer === 'Everything' || activeLayer === 'Risk zones',
  }), [activeLayer]);

  return (
    <main className="twin-workspace">
      <header className="twin-hero">
        <div><div className="twin-kicker"><span className="twin-live-dot" /> SPATIAL OPERATIONS / LIVE MODEL</div><h1>Underground digital twin</h1><p>See the mine as it is now: assets, people, and risk in one operational view.</p></div>
        <div className="twin-hero-actions"><div className="twin-sync"><Wifi size={14} /><span>Live model</span><small>{lastSync ? `updated ${lastSync.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}` : 'connecting'}</small></div><a href="/telemetry" className="twin-action-link"><Activity size={15} /> Open telemetry</a></div>
      </header>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <section className="twin-summary-grid"><article className="twin-summary-primary"><div><span>Operational picture</span><strong>Stable with watch points</strong><small>Model combines telemetry, worker presence, and equipment state</small></div><div className="twin-health-meter"><span>82</span><small>twin health</small></div></article><article className="twin-summary-stat"><Radio size={17} /><div><span>Connected assets</span><strong>{assets.length}</strong><small>Live telemetry nodes</small></div></article><article className="twin-summary-stat"><Users size={17} /><div><span>Workers on shift</span><strong>{workers.length}</strong><small>Presence confirmed</small></div></article><article className="twin-summary-stat warning"><AlertTriangle size={17} /><div><span>Active watch points</span><strong>{hazardCount}</strong><small>Need attention</small></div></article></section>

+      <section className="twin-control-bar"><div className="twin-location"><MapPin size={15} /><div><span>Current view</span><strong>Geva Mine · Panel 17 · North District</strong></div><ChevronDown size={14} /></div><div className="twin-map-tools"><span className="twin-tool-label"><Layers3 size={14} /> Layers</span>{['Everything', 'Equipment', 'People', 'Risk zones'].map((layer) => <button type="button" key={layer} className={activeLayer === layer ? 'active' : ''} onClick={() => setActiveLayer(layer)}>{layer}</button>)}<button type="button" className={`label-toggle ${showLabels ? 'active' : ''}`} onClick={() => setShowLabels(!showLabels)}><Crosshair size={14} /> Labels</button></div></section>

+      <section className="twin-main-layout"><article className="twin-map-panel"><div className="twin-map-heading"><div><span className="twin-panel-kicker">Spatial live view</span><h2>North District / underground plan</h2></div><div className="twin-map-heading-actions"><span><span className="twin-live-dot" /> 2 sec refresh</span><button type="button" title="Fit map"><Maximize2 size={15} /></button><button type="button" title="Refresh now"><RefreshCw size={15} /></button></div></div><div className="twin-map-legend"><span><i className="twin-legend-dot good" /> Normal</span><span><i className="twin-legend-dot watch" /> Watch</span><span><i className="twin-legend-dot danger" /> Hazard</span><span><i className="twin-legend-dot worker" /> Worker presence</span></div><div className="twin-map-canvas"><div className="twin-map-grid" /><div className="twin-compass"><span>N</span><i /><span>S</span></div>{mapItems['Risk zones'] && zones.map((zone) => <div className={`twin-map-zone zone-${zone.risk}`} key={zone.id} style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}><span>{zone.label}</span><small>{zone.risk === 'green' ? 'Within operating envelope' : 'Review required'}</small></div>)}{mapItems.Equipment && assets.map((asset) => <button className={`twin-map-asset asset-${asset.status} ${selected?.id === asset.id ? 'selected' : ''}`} key={asset.id} style={{ left: `${asset.x}%`, top: `${asset.y}%` }} onClick={() => setSelected(asset)} title={`Inspect ${asset.label}`}><span className="twin-asset-pulse" /><span className="twin-asset-pin"><Zap size={14} /></span>{showLabels && <span className="twin-asset-label"><strong>{asset.label}</strong><small>{asset.status === 'green' ? 'Operational' : asset.status === 'yellow' ? 'Watch' : 'Hazard'}</small></span>}</button>)}{mapItems.People && workers.map((worker) => <div className="twin-map-worker" key={worker.id} style={{ left: `${worker.x}%`, top: `${worker.y}%` }} title={`${worker.name} / ${worker.id}`}><span><UserRound size={13} /></span>{showLabels && <small>{worker.id}</small>}</div>)}{!state && <div className="twin-loading"><RefreshCw size={20} /> Loading spatial state...</div>}<div className="twin-map-scale"><span>0</span><i /><span>100 m</span></div></div></article>

+        <aside className="twin-inspector"><section className="twin-inspector-card selected-inspector"><div className="twin-inspector-heading"><div><span className="twin-panel-kicker">Asset inspector</span><h2>{selected?.label || 'Select an equipment node'}</h2></div>{selected && <button type="button" onClick={() => setSelected(null)} aria-label="Clear selected asset"><X size={15} /></button>}</div>{selected ? <><div className={`twin-asset-state ${selectedStatus}`}><span /> {selected.status === 'red' ? 'Hazard detected' : selected.status === 'yellow' ? 'Watch condition' : 'Operational'}<small>{selectedZone?.label || selected.zone}</small></div><div className="twin-sensor-grid">{Object.entries(selected.values).map(([key, value]) => { const [label, unit] = sensorLabels[key] || [key.replaceAll('_', ' '), '']; return <div key={key}><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>; })}</div>{selected.hazards.length > 0 ? <div className="twin-hazard-stack">{selected.hazards.map((hazard) => <div className="twin-hazard" key={hazard.code}><AlertTriangle size={14} /><div><strong>{hazard.message}</strong><span>Automated risk signal · review recommended</span></div></div>)}</div> : <div className="twin-safe-state"><CheckCircle2 size={14} /> No active hazards on this asset</div>}<div className="twin-inspector-actions"><a href="/telemetry">View sensor history <ArrowRight size={13} /></a><a href="/tickets">Open work orders <ArrowRight size={13} /></a></div></> : <div className="twin-select-empty"><Crosshair size={23} /><p>Choose an asset on the map to inspect live values, hazard state, and response paths.</p></div>}</section><section className="twin-inspector-card"><div className="twin-inspector-heading"><div><span className="twin-panel-kicker">Presence layer</span><h2>People underground</h2></div><Users size={17} className="twin-muted-icon" /></div><div className="twin-worker-list">{workers.map((worker) => <div key={worker.id}><span className="twin-worker-avatar"><UserRound size={13} /></span><div><strong>{worker.name}</strong><small>{worker.id} · {worker.zone}</small></div><span className="twin-worker-status"><i /> {worker.status}</span></div>)}</div><div className="twin-presence-footer"><ShieldCheck size={13} /> Presence heartbeat healthy <span>·</span> 2/2 nodes responding</div></section><section className="twin-inspector-card twin-system-card"><div><BatteryCharging size={16} /><span>Edge gateway</span><strong>98% online</strong></div><div><Radio size={16} /><span>Sensor heartbeat</span><strong>Healthy</strong></div></section></aside></section>
</main>
  );
}
