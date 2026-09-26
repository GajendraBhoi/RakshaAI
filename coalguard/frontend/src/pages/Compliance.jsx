import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Fingerprint,
  History,
  LockKeyhole,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import api from '../lib/api';

const forms = [
  ['form-iv-a', 'Form IV-A', 'Dangerous occurrence notice'],
  ['form-b', 'Form B', 'Monthly safety return'],
];

const requirementMeta = {
  'Monthly Air Quality': { area: 'Ventilation & Gas', ref: 'CMR 2017 · Reg. 153', owner: 'Ventilation officer', evidence: 'Telemetry log' },
  'Daily Water Discharge': { area: 'Environment', ref: 'Mines Act · Sec. 18', owner: 'Shift overman', evidence: 'Inspection record' },
};

function getMeta(requirement) {
  return requirementMeta[requirement.title] || { area: 'Mine operations', ref: 'CMR 2017', owner: 'Mine manager', evidence: 'Field evidence' };
}

function dueLabel(date, status) {
  if (status === 'overdue') return 'Overdue';
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return days <= 1 ? 'Due tomorrow' : `Due in ${days} days`;
}

export default function Compliance() {
  const [form, setForm] = useState('form-iv-a');
  const [report, setReport] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All status');
  const [selectedRequirement, setSelectedRequirement] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const [reportResponse, requirementResponse] = await Promise.all([
          api.get(`/api/dgms/preview?form=${form}`),
          api.get('/compliance'),
        ]);
        if (cancelled) return;
        setReport(reportResponse.data);
        setRequirements(requirementResponse.data || []);
        setError('');
      } catch {
        if (!cancelled) setError('Compliance services are unavailable. Start the backend to load the statutory ledger.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [form]);

  const filteredRequirements = useMemo(() => requirements.filter((requirement) => {
    const meta = getMeta(requirement);
    return `${requirement.title} ${meta.area} ${meta.ref}`.toLowerCase().includes(query.toLowerCase())
      && (statusFilter === 'All status' || requirement.status === statusFilter);
  }), [requirements, query, statusFilter]);

  const compliantCount = requirements.filter((requirement) => requirement.status === 'compliant').length;
  const overdueCount = requirements.filter((requirement) => requirement.status === 'overdue').length;
  const readiness = requirements.length ? Math.round((compliantCount / requirements.length) * 100) : 100;

  return (
    <main className="compliance-workspace">
      <header className="compliance-hero">
        <div><div className="compliance-kicker"><span className="compliance-live-dot" /> GOVERNANCE / STATUTORY CONTROL</div><h1>Compliance command</h1><p>One ledger for obligations, evidence, and reports ready for review.</p></div>
        <div className="compliance-hero-actions"><div className="compliance-sync"><CheckCircle2 size={14} /><span>Ledger synced</span><small>just now</small></div><a href="/inspect" className="compliance-action-link"><FileCheck2 size={15} /> Start inspection</a></div>
      </header>

      {error && <div className="inline-error" role="alert">{error}</div>}

      <section className="compliance-summary-grid">
        <article className="compliance-readiness-card"><div className="readiness-copy"><span>Mine compliance readiness</span><strong>{readiness}%</strong><small>Current reporting period · Geva Mine / CG-04</small></div><div className="readiness-ring" style={{ '--readiness': `${readiness}%` }}><span>{readiness}%</span></div></article>
        <article className="compliance-summary-item"><div className="summary-icon good"><CheckCircle2 size={17} /></div><div><span>Compliant obligations</span><strong>{compliantCount}</strong><small>Evidence accepted</small></div></article>
        <article className="compliance-summary-item"><div className="summary-icon danger"><AlertCircle size={17} /></div><div><span>Overdue obligations</span><strong>{overdueCount}</strong><small>Requires owner action</small></div></article>
        <article className="compliance-summary-item"><div className="summary-icon neutral"><FileText size={17} /></div><div><span>Report packages</span><strong>02</strong><small>Ready to export</small></div></article>
      </section>

      <section className="compliance-ledger-panel">
        <div className="compliance-section-heading"><div><span className="compliance-panel-kicker">Obligation ledger</span><h2>What needs attention</h2></div><div className="compliance-heading-note"><CalendarClock size={14} /> Reporting period: September 2026</div></div>
        <div className="compliance-controls"><div className="compliance-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search obligation, area, or regulation..." /></div><div className="compliance-select"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All status</option><option value="overdue">Overdue</option><option value="compliant">Compliant</option></select><ChevronDown size={13} /></div><span className="compliance-result-count">{filteredRequirements.length} obligations</span></div>
        {loading ? <div className="compliance-loading">Loading statutory ledger...</div> : <div className="obligation-table"><div className="obligation-table-head"><span>Requirement</span><span>Regulatory anchor</span><span>Owner</span><span>Due state</span><span>Status</span></div>{filteredRequirements.map((requirement) => { const meta = getMeta(requirement); return <button type="button" className="obligation-row" key={requirement.id} onClick={() => setSelectedRequirement(requirement)}><span className="obligation-name"><span className={`obligation-status-dot ${requirement.status}`} /><strong>{requirement.title}</strong><small>{meta.area}</small></span><span><strong>{meta.ref}</strong><small>{meta.evidence}</small></span><span>{meta.owner}</span><span className={requirement.status === 'overdue' ? 'due-overdue' : 'due-safe'}><Clock3 size={12} /> {dueLabel(requirement.due_date, requirement.status)}</span><span className={`obligation-status ${requirement.status}`}><span /> {requirement.status}</span></button>; })}</div>}
      </section>

      <section className="compliance-lower-grid">
        <article className="statutory-preview-panel"><div className="compliance-section-heading"><div><span className="compliance-panel-kicker">Statutory output</span><h2>Report packages</h2></div><span className="signed-package"><Fingerprint size={13} /> Signed payloads</span></div><div className="compliance-form-tabs">{forms.map(([value, label, subtitle]) => <button type="button" key={value} className={form === value ? 'active' : ''} onClick={() => setForm(value)}><strong>{label}</strong><small>{subtitle}</small></button>)}</div>{loading || !report ? <div className="compliance-loading">Generating preview...</div> : <div className="report-preview-shell"><div className="report-preview-top"><span className="report-seal-small">DGMS</span><div><strong>{report.title}</strong><small>RakshaAI · generated {new Date(report.generated_at).toLocaleDateString()}</small></div><span className="preview-status"><CheckCircle2 size={12} /> Ready</span></div><div className="report-preview-fields">{Object.entries(report.fields).slice(0, 4).map(([label, value]) => <div key={label}><span>{label}</span><strong>{String(value)}</strong></div>)}</div><div className="report-signature-strip"><LockKeyhole size={13} /><span>Canonical signature</span><code>{report.signature.slice(0, 18)}...</code></div></div>}<div className="preview-actions"><a className="compliance-download-button" href={`${api.defaults.baseURL}/api/dgms/download?form=${form}`} target="_blank" rel="noreferrer"><Download size={14} /> Download signed PDF</a><button type="button" className="compliance-outline-button"><ExternalLink size={14} /> Open full preview</button></div></article>

        <aside className="evidence-ledger-panel"><div className="compliance-section-heading"><div><span className="compliance-panel-kicker">Evidence ledger</span><h2>Source coverage</h2></div><History size={17} className="compliance-muted-icon" /></div>{report && <div className="evidence-ledger-stats"><div><strong>{report.evidence.incident_count}</strong><span>Vision incidents</span></div><div><strong>{report.evidence.ticket_count}</strong><span>Corrective tickets</span></div><div><strong>{report.evidence.hazard_count}</strong><span>Active hazards</span></div></div>}<div className="evidence-coverage"><div><span>Telemetry provenance</span><strong>92%</strong></div><div className="coverage-track"><i style={{ width: '92%' }} /></div><div><span>Field evidence attached</span><strong>78%</strong></div><div className="coverage-track amber"><i style={{ width: '78%' }} /></div></div><div className="validation-notes"><span>Validation notes</span>{report?.warnings?.length ? report.warnings.map((warning) => <p key={warning}><AlertCircle size={13} /> {warning}</p>) : <p className="validation-safe"><CheckCircle2 size={13} /> All mandatory demo fields are populated.</p>}</div></aside>
      </section>

      <footer className="compliance-footer-bar"><span><ShieldCheck size={14} /> Evidence is immutable after report signature.</span><span>Last audit trail event: statutory preview generated · 11:36 AM</span><a href="/tickets">Review corrective actions <ArrowRight size={13} /></a></footer>

      {selectedRequirement && <div className="compliance-drawer-backdrop" onClick={() => setSelectedRequirement(null)}><aside className="compliance-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><span className="compliance-panel-kicker">Requirement review</span><h2>{selectedRequirement.title}</h2></div><button type="button" className="drawer-close" onClick={() => setSelectedRequirement(null)}><X size={17} /></button></div><div className="requirement-drawer-status"><span className={`obligation-status ${selectedRequirement.status}`}><span /> {selectedRequirement.status}</span><span>{dueLabel(selectedRequirement.due_date, selectedRequirement.status)}</span></div><div className="requirement-detail-card"><span>Regulatory anchor</span><strong>{getMeta(selectedRequirement).ref}</strong><small>{getMeta(selectedRequirement).area}</small></div><div className="requirement-detail-card"><span>Accountable owner</span><strong>{getMeta(selectedRequirement).owner}</strong><small>Evidence type: {getMeta(selectedRequirement).evidence}</small></div><div className="requirement-timeline"><span className="compliance-panel-kicker">Evidence activity</span><div><CheckCircle2 size={15} /><p><strong>Requirement registered</strong><small>Current reporting period · system ledger</small></p></div><div><Clock3 size={15} /><p><strong>Next review due</strong><small>{new Date(selectedRequirement.due_date).toLocaleDateString()}</small></p></div></div><button type="button" className="requirement-review-button" onClick={() => setSelectedRequirement(null)}>Open evidence workspace <ArrowRight size={14} /></button></aside></div>}
    </main>
  );
}

