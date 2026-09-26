import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertOctagon,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CloudOff,
  FileCheck2,
  FileText,
  Fingerprint,
  Gauge,
  LocateFixed,
  LockKeyhole,
  ScanLine,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  Wifi,
} from 'lucide-react';
import { addToQueue, getQueue } from '../lib/idb';
import { syncOfflineQueue } from '../lib/api';

export default function Inspect() {
  const mineId = 'c0000000-0000-0000-0000-000000000000';
  const [activeDomain, setActiveDomain] = useState('Coal Mining');
  const [checks, setChecks] = useState({ 'shearer-guard': 'pass', 'conveyor-stop': 'flagged', 'face-clearance': 'pass', 'support-resistance': 'pass' });
  const [severity, setSeverity] = useState('Low');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(false);
  const [gps, setGps] = useState({ lat: null, lon: null });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeRegister, setActiveRegister] = useState('Overman Daily Report');
  const [showSignature, setShowSignature] = useState(false);
  const fileInputRef = React.useRef(null);

  const domains = ['Coal Mining', 'Ventilation & Gas', 'M&E', 'Transportation', 'Roof Support'];
  const checklist = [
    { id: 'shearer-guard', task: 'Shearer maintenance', factor: 'Guarding and interlocks intact', severity: 'General' },
    { id: 'conveyor-stop', task: 'Conveyor operation', factor: 'Emergency pull-cord accessible', severity: 'Major' },
    { id: 'face-clearance', task: 'Face advance', factor: 'Clearance and travelway maintained', severity: 'Relatively Major' },
    { id: 'support-resistance', task: 'Hydraulic support', factor: 'Resistance within approved setting', severity: 'General' },
  ];
  const telemetry = [
    { label: 'Methane CH₄', value: '0.45', unit: '%', limit: '< 1.00%', tone: 'green', icon: Gauge },
    { label: 'Carbon monoxide', value: '12', unit: 'ppm', limit: '< 50 ppm', tone: 'green', icon: ScanLine },
    { label: 'Oxygen O₂', value: '20.4', unit: '%', limit: '≥ 19.5%', tone: 'blue', icon: ShieldCheck },
    { label: 'Airflow velocity', value: '2.8', unit: 'm/s', limit: '1.5 - 10.0', tone: 'cyan', icon: ScanLine },
  ];

  const updateQueueCount = async () => {
    const q = await getQueue();
    setPendingCount(q.length);
  };

  useEffect(() => {
    updateQueueCount();

    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineQueue();
      await updateQueueCount();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCaptureGPS = () => {
    setGps({ lat: 23.75, lon: 86.42 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if ((severity === 'High' || severity === 'Critical') && !photo) {
      setError('Photo is required for High/Critical severity observations.');
      return;
    }
    if (!gps.lat) {
      setError('GPS coordinates are required.');
      return;
    }

    const payload = {
      temp_uuid: uuidv4(),
      mine_id: mineId,
      gps_lat: gps.lat,
      gps_lon: gps.lon,
      severity,
      description,
      photo_url: photo ? "/fake/new_photo.jpg" : null
    };

    try {
      if (isOnline) {
        const { default: api } = await import('../lib/api');
        await api.post('/inspections', payload);
        setSuccess('Inspection submitted directly to server.');
      } else {
        await addToQueue(payload);
        await updateQueueCount();
        setSuccess('Offline. Saved to local queue.');
      }
      
      setDescription('');
      setPhoto(false);
      setGps({ lat: null, lon: null });
    } catch (err) {
      if (err.response?.status === 422) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : detail?.message || 'Validation failed');
      } else {
        setError('Failed to submit inspection');
      }
    }
  };

  const setCheck = (id, value) => setChecks((current) => ({ ...current, [id]: value }));

  return (
    <div className="inspection-page">
      <div className="inspection-context-bar">
        <div className="inspection-context-title">
          <div className="inspection-kicker"><span className="live-dot" /> FIELD WORKSPACE / INSPECTION 02481</div>
          <h1>Underground inspection</h1>
          <p>CMRMC risk checklist <span>•</span> Longwall Face #2 <span>•</span> Shift B</p>
        </div>
        <div className="inspection-context-controls">
          <div className={`inspection-network ${isOnline ? 'online' : 'offline'}`}>{isOnline ? <Wifi size={15} /> : <CloudOff size={15} />}<span>{isOnline ? 'Online' : 'Offline'}</span><small>{isOnline ? 'Synced' : 'Edge caching enabled'}</small></div>
          <div className="inspection-inspector"><div className="inspection-avatar">CB</div><div><strong>Chandan Bhagat</strong><span>Overman · ID OM-2048</span></div><ChevronDown size={14} /></div>
        </div>
      </div>
      <div className="inspection-location-strip"><div><span>Mine</span><strong>Geva Mine / CG-04</strong></div><div><span>Underground section</span><strong>Panel 17 · North District</strong></div><div><span>Gallery</span><strong>Longwall Face #2</strong></div><div><span>Inspection started</span><strong>22 Sep 2026 · 11:36 AM</strong></div><button type="button" className="inspection-outline-button" onClick={handleCaptureGPS}><LocateFixed size={15} /> {gps.lat ? 'Location verified' : 'Verify location'}</button></div>
      {error && <div className="inspection-notice error"><AlertOctagon size={16} /> {error}</div>}
      {success && <div className="inspection-notice success"><CheckCircle2 size={16} /> {success}</div>}
      <section className="inspection-metric-grid">{telemetry.map(({ label, value, unit, limit, tone, icon: Icon }) => <article className={`inspection-metric metric-${tone}`} key={label}><div className="metric-icon"><Icon size={18} /></div><div><span>{label}</span><strong>{value} <small>{unit}</small></strong><em><span className="metric-pulse" /> Within limit · {limit}</em></div></article>)}</section>

      <div className="inspection-layout">
        <form id="inspection-form" onSubmit={handleSubmit} className="inspection-main-column">
          <section className="inspection-panel cv-inspection-panel"><div className="inspection-panel-header"><div><span className="panel-kicker">Khaan Netra · edge vision</span><h2>Live evidence feed</h2></div><span className="inspection-live-badge"><span className="live-dot" /> LIVE · CAMERA UG-17</span></div><div className="inspection-camera-grid"><div className="inspection-camera-frame"><div className="camera-hud"><span>11:36:09</span><span>● 1080P</span></div><div className="camera-scan-line" /><div className="camera-person person-one"><span className="detection-label safe">Helmet 98%</span></div><div className="camera-person person-two"><span className="detection-label warning">No vest 84%</span></div><div className="camera-floor-line" /><div className="camera-placeholder"><ScanLine size={34} /><span>EDGE CAMERA / GALLERY B</span></div></div><div className="inspection-evidence-card"><div className="evidence-card-heading"><span className="evidence-alert-icon"><AlertOctagon size={16} /></span><div><strong>Latest AI observation</strong><small>Captured 11:32:01 · confidence 84%</small></div></div><h3>Missing high-visibility vest</h3><p>Worker detected in conveyor transit zone without required work wear.</p><div className="evidence-tags"><span>Worker #W-208</span><span>Conveyor 07</span></div><button type="button" className="inspection-text-button"><Camera size={14} /> Use as evidence <ArrowRight size={13} /></button></div></div></section>

          <section className="inspection-panel checklist-panel"><div className="inspection-panel-header checklist-heading"><div><span className="panel-kicker">CMRMC · risk assessment</span><h2>Operational safety checklist</h2></div><span className="checklist-progress"><strong>{Object.values(checks).filter((value) => value === 'pass').length}/4</strong> checks passed</span></div><div className="domain-tabs">{domains.map((domain) => <button type="button" key={domain} className={activeDomain === domain ? 'active' : ''} onClick={() => setActiveDomain(domain)}>{domain}</button>)}</div><div className="checklist-table-head"><span>Operational task / risk factor</span><span>Severity</span><span>Assessment</span></div><div className="checklist-rows">{checklist.map((item, index) => <div className="checklist-row" key={item.id}><div className="checklist-task"><span className="checklist-number">0{index + 1}</span><div><strong>{item.task}</strong><span>{item.factor}</span></div></div><span className={`severity-label ${item.severity.toLowerCase().replaceAll(' ', '-')}`}>{item.severity}</span><div className="assessment-buttons">{['pass', 'flagged', 'fail'].map((value) => <button type="button" key={value} className={`${value} ${checks[item.id] === value ? 'selected' : ''}`} onClick={() => setCheck(item.id, value)}>{checks[item.id] === value && <Check size={12} />} {value}</button>)}</div></div>)}</div></section>

          <section className="inspection-panel observation-panel"><div className="inspection-panel-header"><div><span className="panel-kicker">Inspector notes</span><h2>Record an observation</h2></div><span className="required-note">Required for flagged items</span></div><div className="observation-grid"><div className="form-group"><label className="form-label">Severity classification</label><select value={severity} onChange={(e) => setSeverity(e.target.value)} className="form-select"><option value="Low">General</option><option value="Medium">Relatively Major</option><option value="High">Major</option><option value="Critical">Particularly Major</option></select></div><div className="observation-quick-status"><span>Recommended action</span><strong><ShieldAlert size={15} /> Create corrective ticket</strong><small>Based on flagged conveyor item</small></div></div><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-textarea" rows="4" required placeholder="Describe the condition, immediate controls applied, and any worker or equipment involved..." /><div className="evidence-actions"><input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={(e) => e.target.files?.length && setPhoto(true)} hidden /><button type="button" className={`evidence-action ${photo ? 'attached' : ''}`} onClick={() => fileInputRef.current?.click()}><Camera size={17} /><span><strong>{photo ? 'Photo attached' : 'Capture photo evidence'}</strong><small>{photo ? 'new_photo.jpg ready to submit' : 'Required for major or critical findings'}</small></span><Upload size={15} /></button><button type="button" className={`evidence-action ${gps.lat ? 'attached' : ''}`} onClick={handleCaptureGPS}><LocateFixed size={17} /><span><strong>{gps.lat ? 'Geo-location verified' : 'Capture geo-location'}</strong><small>{gps.lat ? `${gps.lat}, ${gps.lon}` : 'Physical presence check required'}</small></span><CheckCircle2 size={15} /></button></div></section>
        </form>

        <aside className="inspection-side-column"><section className="inspection-panel ai-panel"><div className="ai-panel-title"><span className="ai-spark"><Sparkles size={16} /></span><div><span className="panel-kicker">CMSEKG engine</span><h2>Risk intelligence</h2></div><span className="ai-status">AI assisted</span></div><div className="ai-alert"><AlertOctagon size={15} /><strong>Flagged risk detected</strong><span>Conveyor emergency stop</span></div><div className="ai-section"><span>Historical precedent</span><p>3 similar observations in Panel 17 over the last 90 days.</p></div><div className="ai-section"><span>Recommended control</span><p>Isolate conveyor, test pull-cord continuity, and verify guard clearance before restart.</p></div><button type="button" className="inspection-link-button">Open root-cause graph <ArrowRight size={14} /></button></section>
          <section className="inspection-panel register-panel"><div className="inspection-panel-header"><div><span className="panel-kicker">Statutory registers</span><h2>Auto-populated forms</h2></div><FileCheck2 size={18} className="panel-header-icon" /></div><div className="register-tabs">{['Overman Daily Report', 'Workmen Inspector', 'Form IV-A'].map((register) => <button type="button" key={register} className={activeRegister === register ? 'active' : ''} onClick={() => setActiveRegister(register)}>{register}</button>)}</div><div className="register-preview"><div className="register-preview-header"><FileText size={16} /><span>{activeRegister}</span><span className="preview-ready">Ready</span></div><div className="preview-lines"><i /><i /><i /><i /><i /></div><div className="preview-stamp">PREVIEW</div></div><p className="register-citation"><LockKeyhole size={13} /> CMR 2017 · Regulation 47 &amp; 48</p><button type="button" className="inspection-outline-button full-width">Preview &amp; edit register <ArrowRight size={14} /></button></section>
          <section className="inspection-panel signoff-panel"><div className="inspection-panel-header"><div><span className="panel-kicker">Audit trail</span><h2>Verification &amp; sign-off</h2></div><Fingerprint size={19} className="panel-header-icon" /></div><div className="verification-row"><CheckCircle2 size={16} /><div><strong>Physical presence verified</strong><span>{gps.lat ? 'GPS node UG-17 confirmed' : 'Capture location to verify'}</span></div></div><div className="verification-row"><CheckCircle2 size={16} /><div><strong>Inspector identity verified</strong><span>Chandan Bhagat · OM-2048</span></div></div><button type="button" className={`signature-box ${showSignature ? 'signed' : ''}`} onClick={() => setShowSignature(true)}>{showSignature ? <><CheckCircle2 size={18} /><span>Digitally signed by Chandan Bhagat</span></> : <><Fingerprint size={18} /><span>Tap to apply digital signature</span></>}</button></section>
          <section className="inspection-panel offline-panel"><div className="offline-panel-icon"><CloudOff size={18} /></div><div><strong>{pendingCount || 0} drafts waiting to sync</strong><span>{isOnline ? 'All submitted logs will sync automatically.' : 'Saved securely to IndexedDB while offline.'}</span></div></section></aside>
      </div>

      <div className="inspection-submit-bar"><div><span className="draft-state"><span className="draft-dot" /> Draft auto-saved 11:36:09</span><span className="draft-meta">Inspection ID: CG-02481 · {activeDomain}</span></div><div className="inspection-submit-actions"><button type="button" className="inspection-secondary-button" onClick={() => setSuccess('Draft saved locally and ready for review.')}>Save offline draft</button><button type="button" className="inspection-emergency-button"><AlertOctagon size={15} /> Broadcast emergency</button><button type="submit" form="inspection-form" className="inspection-submit-button"><Send size={15} /> Submit inspection log</button></div></div>
    </div>
  );
}
