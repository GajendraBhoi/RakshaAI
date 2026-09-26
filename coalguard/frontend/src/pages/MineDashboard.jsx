import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Gauge,
  HardHat,
  Map,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Ticket,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import api from '../lib/api';
import AccountabilityTimeline from '../components/AccountabilityTimeline';

function percent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

export default function MineDashboard() {
  const { mineId } = useParams();
  const [summary, setSummary] = useState(null);
  const [compliance, setCompliance] = useState([]);
  const [selectedActionId, setSelectedActionId] = useState(null);
  const [activeShift, setActiveShift] = useState('Current shift');
  const [error, setError] = useState('');

  const seededActionId = 'ca1-c';

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [sumRes, compRes] = await Promise.all([
          api.get(`/dashboard/summary?mine_id=${mineId}`),
          api.get(`/compliance?mine_id=${mineId}`),
        ]);
        if (!cancelled) { setSummary(sumRes.data); setCompliance(compRes.data); setError(''); }
      } catch {
        if (!cancelled) setError('Mine dashboard service is unavailable.');
      }
    };
    if (mineId) fetchData();
    return () => { cancelled = true; };
  }, [mineId]);

  const overdueRequirements = compliance.filter((item) => item.status === 'overdue');
  const compliantRequirements = compliance.filter((item) => item.status === 'compliant');
  const readiness = summary?.compliance_rate || 0;
  const riskScore = summary ? Math.max(0, 100 - Math.round(summary.open_violations * 5 + summary.overdue_actions * 3)) : 0;
  const riskTone = riskScore >= 75 ? 'watch' : 'good';
  const shiftBars = useMemo(() => [42, 54, 47, 63, 58, 72, 66, 78, 61, 69, 55, 48], []);
  const [graphMetric, setGraphMetric] = useState('production');
  const graphSeries = useMemo(() => ({
    production: [42, 48, 45, 58, 61, 57, 68, 73, 70, 78, 75, 82],
    safety: [88, 86, 89, 84, 82, 85, 79, 81, 78, 83, 87, 90],
  }), []);
  const riskMix = [
    { label: 'Ventilation & gas', value: summary?.open_violations ? 34 : 18, tone: 'red' },
    { label: 'Mechanical integrity', value: 27, tone: 'amber' },
    { label: 'Workforce controls', value: 21, tone: 'blue' },
    { label: 'Compliance exposure', value: summary?.overdue_actions ? 18 : 9, tone: 'green' },
  ];
  const heatmap = [
    [18, 24, 32, 27, 41, 35, 22],
    [26, 34, 48, 44, 57, 39, 28],
    [12, 19, 25, 31, 37, 29, 16],
  ];

  return (
    <main className="mine-command-page">
      <header className="mine-command-hero"><div><div className="mine-kicker"><span className="mine-live-dot" /> MINE COMMAND / CG-04</div><h1>Geva mine operations</h1><p>North District · Panel 17 · Longwall production overview</p></div><div className="mine-hero-actions"><div className="mine-shift-select"><Clock3 size={14} /><select value={activeShift} onChange={(event) => setActiveShift(event.target.value)}><option>Current shift</option><option>Morning shift</option><option>Afternoon shift</option><option>Night shift</option></select><ChevronDown size={13} /></div><a href="/khaan-netra/index.html" target="_blank" rel="noreferrer" className="mine-outline-action"><Siren size={15} /> Open Khaan Netra</a><a href="/telemetry" className="mine-primary-action"><Activity size={15} /> Live telemetry</a></div></header>
  {error && <div className="inline-error" role="alert">{error}</div>}

      <section className="mine-overview-grid"><article className="mine-risk-card"><div><span>Mine safety posture</span><strong>{riskScore || '--'}<small>/100</small></strong><p><span className={`risk-signal ${riskTone}`} /> {riskTone === 'watch' ? 'Watch points need manager attention' : 'Within operating envelope'}</p></div><div className="mine-risk-ring" style={{ '--risk': `${riskScore}%` }}><span>{riskScore || '--'}%</span></div><div className="mine-risk-reasons">{summary?.open_violations ? <span><AlertTriangle size={12} /> {summary.open_violations} high-severity observations</span> : <span><CheckCircle2 size={12} /> No high-severity observations</span>}{summary?.overdue_actions ? <span><Clock3 size={12} /> {summary.overdue_actions} overdue actions</span> : <span><ShieldCheck size={12} /> Action queue on schedule</span>}</div></article><article className="mine-kpi"><div className="mine-kpi-icon green"><ShieldCheck size={17} /></div><div><span>Compliance readiness</span><strong>{percent(readiness)}</strong><small>{compliantRequirements.length} of {compliance.length || 0} obligations clear</small></div><TrendingUp size={15} className="mine-kpi-trend up" /></article><article className="mine-kpi"><div className="mine-kpi-icon red"><ShieldAlert size={17} /></div><div><span>Open violations</span><strong>{summary?.open_violations ?? '--'}</strong><small>High and critical observations</small></div><TrendingDown size={15} className="mine-kpi-trend down" /></article><article className="mine-kpi"><div className="mine-kpi-icon amber"><Wrench size={17} /></div><div><span>Overdue actions</span><strong>{summary?.overdue_actions ?? '--'}</strong><small>Require owner follow-up</small></div><ArrowRight size={15} className="mine-kpi-trend amber" /></article></section>

      <section className="mine-main-grid"><article className="mine-pulse-panel"><div className="mine-panel-heading"><div><span className="mine-panel-kicker">Operational pulse</span><h2>Production &amp; safety signal</h2></div><div className="mine-panel-period"><span className="mine-live-dot" /> Live <ChevronDown size={12} /></div></div><div className="mine-pulse-meta"><div><span>Shift output</span><strong>78%</strong><small>of planned tonnage</small></div><div><span>Air quality</span><strong className="good-text">Normal</strong><small>Last reading 11:34</small></div><div><span>People underground</span><strong>24</strong><small>2 working faces</small></div></div><div className="mine-pulse-chart"><div className="mine-chart-y"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="mine-chart-body"><div className="mine-chart-grid" /><div className="mine-bars">{shiftBars.map((height, index) => <i key={index} style={{ height: `${height}%` }} className={height > 70 ? 'peak' : ''} />)}</div><div className="mine-chart-x"><span>06:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div></div></div><div className="mine-pulse-footer"><span><i className="chart-key output" /> Shift output</span><span><i className="chart-key target" /> Target band</span><span className="mine-pulse-caption"><TrendingUp size={13} /> 6.4% ahead of last shift</span></div></article>

        <aside className="mine-risk-panel"><div className="mine-panel-heading"><div><span className="mine-panel-kicker">Risk register</span><h2>What needs a look</h2></div><a href="/safety-intelligence"><ArrowRight size={15} /></a></div><div className="mine-risk-list"><div className="mine-risk-item high"><span className="mine-risk-icon"><AlertTriangle size={15} /></span><div><strong>Dust suppression offline</strong><small>Conveyor 07 · 16 days overdue</small></div><span className="mine-risk-level">High</span></div><div className="mine-risk-item medium"><span className="mine-risk-icon"><Gauge size={15} /></span><div><strong>Bearing temperature rising</strong><small>Telemetry · inspection this shift</small></div><span className="mine-risk-level">Watch</span></div><div className="mine-risk-item low"><span className="mine-risk-icon"><ClipboardCheck size={15} /></span><div><strong>Water discharge record</strong><small>Due in 2 days · evidence ready</small></div><span className="mine-risk-level">Clear</span></div></div><a href="/tickets" className="mine-panel-link">Open risk &amp; action queue <ArrowRight size={13} /></a></aside></section>
 
      <section className="mine-lower-grid"><article className="mine-compliance-panel"><div className="mine-panel-heading"><div><span className="mine-panel-kicker">Statutory readiness</span><h2>Compliance obligations</h2></div><a href="/compliance">View register <ArrowRight size={13} /></a></div><div className="mine-compliance-progress"><div><span>Current readiness</span><strong>{percent(readiness)}</strong></div><div className="mine-progress-track"><i style={{ width: `${readiness}%` }} /></div></div><div className="mine-requirement-list">{compliance.length ? compliance.map((item) => <div className="mine-requirement" key={item.id}><span className={`requirement-dot ${item.status}`} /><div><strong>{item.title}</strong><small>Statutory record · due {new Date(item.due_date).toLocaleDateString()}</small></div><span className={`requirement-state ${item.status}`}>{item.status === 'overdue' ? 'Overdue' : 'Compliant'}</span></div>) : <p className="mine-muted">No obligations returned for this mine.</p>}</div><div className="mine-compliance-footer"><span><CheckCircle2 size={13} /> {compliantRequirements.length} records have accepted evidence</span><span>{overdueRequirements.length} need attention</span></div></article><article className="mine-presence-panel"><div className="mine-panel-heading"><div><span className="mine-panel-kicker">People &amp; places</span><h2>Underground coverage</h2></div><Map size={17} className="mine-muted-icon" /></div><div className="mine-mini-map"><div className="mine-gallery-line line-one" /><div className="mine-gallery-line line-two" /><span className="mine-map-label label-north">North district</span><span className="mine-map-label label-face">Face #2</span><span className="mine-map-worker worker-a"><UserDot /></span><span className="mine-map-worker worker-b"><UserDot /></span><span className="mine-map-asset asset-a"><Radio size={12} /></span><span className="mine-map-asset asset-b"><Radio size={12} /></span></div><div className="mine-presence-stats"><div><Users size={14} /><strong>24</strong><span>on shift</span></div><div><HardHat size={14} /><strong>02</strong><span>active faces</span></div><div><Radio size={14} /><strong>98%</strong><span>coverage</span></div></div><a href="/digital-twin" className="mine-panel-link">Open digital twin <ArrowRight size={13} /></a></article><article className="mine-timeline-panel"><div className="mine-panel-heading"><div><span className="mine-panel-kicker">Accountability</span><h2>Corrective action trail</h2></div><button type="button" className="mine-load-action" onClick={() => setSelectedActionId(seededActionId)}>{selectedActionId ? 'Refresh' : 'Load trail'}</button></div>{selectedActionId ? <AccountabilityTimeline actionId={selectedActionId} /> : <div className="mine-timeline-empty"><Ticket size={20} /><p>Follow a finding from observation to verified closure.</p><button type="button" onClick={() => setSelectedActionId(seededActionId)}>View seeded action <ArrowRight size={13} /></button></div>}</article></section>

      <section className="mine-analytics-grid">
        <article className="mine-analytics-panel mine-trend-panel">
          <div className="mine-panel-heading"><div><span className="mine-panel-kicker">Advanced signal analysis</span><h2>Production versus safety</h2></div><div className="mine-chart-tabs">{['production', 'safety'].map((metric) => <button type="button" key={metric} className={graphMetric === metric ? 'active' : ''} onClick={() => setGraphMetric(metric)}>{metric}</button>)}</div></div>
          <div className="mine-line-chart"><div className="mine-line-y"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="mine-line-body"><div className="mine-line-grid" /><svg viewBox="0 0 600 190" preserveAspectRatio="none" aria-label={`${graphMetric} trend chart`}><polyline className="mine-chart-area-fill" points={`0,190 ${graphSeries[graphMetric].map((value, index) => `${index * 54.5},${190 - value * 1.7}`).join(' ')} 600,190`} /><polyline className={`mine-chart-line ${graphMetric}`} points={graphSeries[graphMetric].map((value, index) => `${index * 54.5},${190 - value * 1.7}`).join(' ')} /></svg><div className="mine-line-x"><span>06:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div></div></div><div className="mine-analytics-legend"><span><i className={`line-key ${graphMetric}`} /> {graphMetric === 'production' ? 'Output index' : 'Safety index'}</span><span className="mine-analytics-note"><TrendingUp size={13} /> {graphMetric === 'production' ? 'Current shift trending above plan' : 'Safety posture recovering after controls'}</span></div>
        </article>
        <article className="mine-analytics-panel mine-risk-mix"><div className="mine-panel-heading"><div><span className="mine-panel-kicker">Risk composition</span><h2>Where exposure sits</h2></div><a href="/safety-intelligence"><ArrowRight size={15} /></a></div><div className="risk-donut-layout"><div className="risk-donut"><div><strong>{riskMix.reduce((total, item) => total + item.value, 0)}%</strong><span>active exposure</span></div></div><div className="risk-mix-list">{riskMix.map((item) => <div key={item.label}><span><i className={`risk-mix-dot ${item.tone}`} />{item.label}</span><strong>{item.value}%</strong><div><i className={`risk-mix-bar ${item.tone}`} style={{ width: `${item.value * 2}%` }} /></div></div>)}</div></div></article>
        <article className="mine-analytics-panel mine-heatmap-panel"><div className="mine-panel-heading"><div><span className="mine-panel-kicker">Spatiotemporal pattern</span><h2>Risk intensity by zone &amp; shift</h2></div><span className="heatmap-scale"><i /> low <i /> high</span></div><div className="mine-heatmap"><div className="heatmap-y-labels"><span>North</span><span>Central</span><span>Longwall</span></div><div className="heatmap-body">{heatmap.map((row, rowIndex) => <div className="heatmap-row" key={rowIndex}>{row.map((value, colIndex) => <span key={`${rowIndex}-${colIndex}`} title={`${value}% risk intensity`} style={{ '--heat': `${value}%` }} />)}</div>)}<div className="heatmap-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div><div className="heatmap-caption"><AlertTriangle size={13} /> Thursday night in Longwall shows the highest anomaly clustering.</div></article>
      </section>

      <footer className="mine-footer-strip"><span><Radio size={13} /> Mine data stream healthy</span><span>Last sync · 11:36:09</span><a href="/inspect">Start field inspection <ArrowRight size={13} /></a></footer>
</main>
  );
}

function UserDot() {
  return <Users size={10} />;
}
