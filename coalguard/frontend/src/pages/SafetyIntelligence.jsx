import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  HelpCircle,
  MessageCircle,
  Network,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import api from '../lib/api';

const anomalyOptions = [
  ['BEARING_OVERHEAT', 'Bearing overheat', 'Mechanical'],
  ['METHANE_HIGH', 'Methane concentration', 'Ventilation'],
  ['ZONE_INTRUSION', 'Worker-zone intrusion', 'Human factors'],
  ['VIBRATION_HIGH', 'Abnormal vibration', 'Mechanical'],
];

const threatCards = [
  { label: 'Gas / explosion', value: 18, state: 'Controlled', tone: 'green', icon: Flame },
  { label: 'Roof instability', value: 31, state: 'Watch', tone: 'amber', icon: ShieldAlert },
  { label: 'Heating / fire', value: 12, state: 'Controlled', tone: 'green', icon: Zap },
  { label: 'Water / dust', value: 24, state: 'Watch', tone: 'blue', icon: Activity },
];

const patternRules = [
  { rule: 'High vibration + bearing heat', result: 'Mechanical fault', confidence: '86%', tone: 'orange' },
  { rule: 'Night shift + zone intrusion', result: 'Visibility risk', confidence: '74%', tone: 'violet' },
  { rule: 'Methane rise + low airflow', result: 'Gas accumulation', confidence: '91%', tone: 'red' },
];

function nodeKind(kind) {
  return kind.toLowerCase().replace(/\s+/g, '-');
}

export default function SafetyIntelligence() {
  const [anomaly, setAnomaly] = useState('BEARING_OVERHEAT');
  const [graph, setGraph] = useState(null);
  const [question, setQuestion] = useState('What is the statutory response to a methane leak?');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadGraph = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/rca/graph?anomaly=${anomaly}`);
        if (!cancelled) { setGraph(response.data); setSelectedNode(null); setError(''); }
      } catch {
        if (!cancelled) setError('Root-cause service is unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadGraph();
    return () => { cancelled = true; };
  }, [anomaly]);

  const askAssistant = async (event) => {
    event.preventDefault();
    setAsking(true);
    try {
      const response = await api.post('/api/ai/query', { question });
      setAnswer(response.data);
      setError('');
    } catch {
      setError('Safety assistant is unavailable.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <main className="intelligence-workspace">
      <header className="intelligence-hero">
        <div><div className="intelligence-kicker"><span className="intelligence-live-dot" /> INTELLIGENCE / DECISION SUPPORT</div><h1>Safety intelligence</h1><p>From weak signal to defensible action, before the shift becomes an incident.</p></div>
        <div className="intelligence-hero-actions"><div className="model-status"><span /> Models operational <small>last refresh 11:34</small></div><a href="/telemetry" className="intelligence-action-link"><Activity size={15} /> Live telemetry</a></div>
      </header>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <section className="intelligence-score-row">
        <article className="mine-safety-score"><div className="score-copy"><span>Composite mine safety index</span><strong>82<span>/100</span></strong><small><TrendingUp size={13} /> 4.8 pts above last week</small></div><div className="score-arc"><div><strong>82%</strong><span>Stable</span></div></div><div className="score-foot"><span>Telemetry 42%</span><span>Field checks 35%</span><span>Open actions 23%</span></div></article>
        <article className="anomaly-ticker"><div className="ticker-heading"><span><span className="ticker-pulse" /> Active anomaly ticker</span><small>3 signals</small></div><div className="ticker-event"><div className="ticker-icon danger"><AlertTriangle size={15} /></div><div><strong>Bearing thermal rise at Conveyor 07</strong><span>Sensor fusion · 2 min ago</span></div><ArrowRight size={15} /></div><div className="ticker-event"><div className="ticker-icon warning"><ShieldAlert size={15} /></div><div><strong>Worker entered restricted zone</strong><span>Khaan Netra · 12 min ago</span></div><ArrowRight size={15} /></div></article>
      </section>
      <section className="threat-grid">{threatCards.map(({ label, value, state, tone, icon: Icon }) => <article className={`threat-card threat-${tone}`} key={label}><div className="threat-top"><span className="threat-icon"><Icon size={16} /></span><span className="threat-state"><span /> {state}</span></div><span>{label}</span><strong>{value}<small>/100</small></strong><div className="threat-track"><i style={{ width: `${value}%` }} /></div></article>)}</section>
      <section className="intelligence-main-grid">
        <article className="causal-canvas-panel">
          <div className="intelligence-panel-heading"><div><span className="intelligence-panel-kicker">CMSEKG / causal analysis</span><h2>Follow the failure chain</h2></div><div className="anomaly-select-wrap"><select value={anomaly} onChange={(event) => setAnomaly(event.target.value)}>{anomalyOptions.map(([value, label, group]) => <option value={value} key={value}>{group} · {label}</option>)}</select><ChevronDown size={13} /></div></div>
          <div className="causal-canvas-toolbar"><span><Network size={14} /> Pattern layer</span><span className="canvas-legend"><i className="legend-irf" /> Initial risk <i className="legend-ime" /> Intermediate <i className="legend-con" /> Consequence</span><button type="button"><Target size={13} /> Center graph</button></div>
          {loading && <div className="intelligence-loading">Tracing causal path...</div>}
          {!loading && graph && <div className="causal-canvas"><div className="canvas-grid" /><div className="causal-chain">{graph.nodes.map((node, index) => <div className="causal-chain-step" key={node.id}><button type="button" className={`graph-node graph-${nodeKind(node.kind)} ${selectedNode?.id === node.id ? 'selected' : ''}`} onClick={() => setSelectedNode(node)}><span className="graph-node-kind">{node.kind}</span><strong>{node.label}</strong><small>{index === 0 ? 'Observed signal' : index === graph.nodes.length - 1 ? 'Safety consequence' : 'Causal link'}</small></button>{index < graph.nodes.length - 1 && <div className="graph-connector"><span /><ArrowRight size={16} /></div>}</div>)}</div><div className="canvas-citation"><span><FileText size={14} /> Regulatory overlay</span><p>{graph.citation}</p></div></div>}
          {selectedNode && <div className="selected-node-note"><span>Selected node</span><strong>{selectedNode.label}</strong><p>This point in the chain is where field verification and corrective action should be attached.</p><button type="button" onClick={() => setSelectedNode(null)}><X size={13} /></button></div>}
        </article>
        <aside className="intelligence-rul-panel"><div className="intelligence-panel-heading"><div><span className="intelligence-panel-kicker">Predictive maintenance</span><h2>RUL watchlist</h2></div><Gauge size={18} className="intelligence-muted-icon" /></div><div className="rul-watch-item"><div className="rul-asset"><span className="asset-status amber" /><div><strong>Conveyor 07 drive</strong><small>Bearing assembly</small></div></div><div className="rul-value"><strong>142h</strong><span>RUL</span></div><div className="rul-bar"><i style={{ width: '64%' }} /></div><span className="rul-note amber"><Clock3 size={11} /> inspect this shift</span></div><div className="rul-watch-item"><div className="rul-asset"><span className="asset-status green" /><div><strong>Shearer 02 motor</strong><small>Drive motor</small></div></div><div className="rul-value"><strong>386h</strong><span>RUL</span></div><div className="rul-bar"><i style={{ width: '83%' }} /></div><span className="rul-note green"><CheckCircle2 size={11} /> normal trajectory</span></div><div className="rul-watch-item"><div className="rul-asset"><span className="asset-status blue" /><div><strong>Haulage pump 04</strong><small>Cooling circuit</small></div></div><div className="rul-value"><strong>218h</strong><span>RUL</span></div><div className="rul-bar"><i style={{ width: '72%' }} /></div><span className="rul-note blue"><TrendingDown size={11} /> trending lower</span></div><a href="/telemetry" className="intelligence-text-link">Open equipment health <ArrowRight size={13} /></a></aside>
      </section>
      <section className="intelligence-insight-grid"><article className="pattern-panel"><div className="intelligence-panel-heading"><div><span className="intelligence-panel-kicker">Association signals</span><h2>Patterns worth watching</h2></div><BarChart3 size={18} className="intelligence-muted-icon" /></div><div className="pattern-list">{patternRules.map((item) => <div className="pattern-row" key={item.rule}><div className={`pattern-mark ${item.tone}`}><GitBranch size={14} /></div><div><strong>{item.rule}</strong><span><ArrowRight size={12} /> {item.result}</span></div><b>{item.confidence}</b></div>)}</div><div className="pattern-footer"><span>FP-growth on 90 days of mine events</span><button type="button">Explore patterns <ArrowRight size={13} /></button></div></article><article className="shift-panel"><div className="intelligence-panel-heading"><div><span className="intelligence-panel-kicker">Spatiotemporal read</span><h2>Risk by shift</h2></div><span className="shift-period">Last 30 days <ChevronDown size={12} /></span></div><div className="shift-chart"><div className="shift-y-axis"><span>High</span><span>Med</span><span>Low</span></div><div className="shift-chart-area"><div className="chart-grid-lines" /><div className="shift-bars"><div><i style={{ height: '54%' }} /><i style={{ height: '38%' }} /><i style={{ height: '67%' }} /></div><div><i style={{ height: '72%' }} /><i style={{ height: '48%' }} /><i style={{ height: '82%' }} /></div><div><i style={{ height: '38%' }} /><i style={{ height: '30%' }} /><i style={{ height: '48%' }} /></div></div><div className="shift-labels"><span>Morning</span><span>Afternoon</span><span>Night</span></div></div></div><div className="shift-callout"><TrendingUp size={14} /><span>Night shift anomalies are <strong>22% higher</strong> than the morning baseline.</span></div></article></section>
      <section className="intelligence-action-row"><div className="mitigation-copy"><span className="intelligence-panel-kicker">Strategic mitigation</span><h2>What deserves attention next</h2><p>Ranked by predicted risk reduction and time to control.</p></div><div className="mitigation-actions"><div><span>01</span><strong>Inspect Conveyor 07 bearing</strong><small>Risk reduction: high · 18 min estimate</small></div><div><span>02</span><strong>Review Face #3 access control</strong><small>Risk reduction: medium · 12 min estimate</small></div><a href="/compliance"><FileText size={14} /> Generate executive brief <ArrowRight size={13} /></a></div></section>
      <button type="button" className="assistant-fab" onClick={() => setAssistantOpen(true)}><MessageCircle size={17} /><span>Ask CMR 2017</span></button>
      {assistantOpen && <div className="assistant-drawer-backdrop" onClick={() => setAssistantOpen(false)}><aside className="intelligence-assistant-drawer" onClick={(event) => event.stopPropagation()}><div className="assistant-drawer-head"><div><span className="intelligence-panel-kicker">Regulatory copilot</span><h2>Ask the safety desk</h2></div><button type="button" onClick={() => setAssistantOpen(false)}><X size={17} /></button></div><div className="assistant-prompt-chips"><button type="button" onClick={() => setQuestion('What is the statutory CH4 limit requiring power shutoff?')}>CH₄ power shutoff limit</button><button type="button" onClick={() => setQuestion('Which DGMS form is required for a major roof fall?')}>Roof fall reporting</button></div><form onSubmit={askAssistant} className="intelligence-assistant-form"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows="3" aria-label="Safety question" /><button type="submit" disabled={asking || question.trim().length < 3}>{asking ? 'Checking statutory context...' : 'Ask safety desk'}</button></form>{answer ? <div className="intelligence-answer"><div className="answer-badge"><Sparkles size={13} /> Cited answer</div><p>{answer.answer}</p><span>Source: {answer.provider}</span>{answer.citations.map((citation) => <div className="answer-citation" key={citation.regulation}><strong>{citation.regulation}</strong><small>{citation.text}</small></div>)}</div> : <div className="assistant-empty"><HelpCircle size={20} /><span>Ask a question grounded in Coal Mines Regulations and DGMS guidance.</span></div>}</aside></div>}
    </main>
  );
}
