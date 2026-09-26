import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  GitBranch,
  List,
  MapPin,
  MessageSquare,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Table2,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import api from '../lib/api';

const columns = [
  ['OPEN', 'Open'],
  ['ASSIGNED', 'Assigned'],
  ['IN_PROGRESS', 'In progress'],
  ['VERIFICATION', 'Verification'],
  ['CLOSED', 'Closed'],
];

const sourceMeta = {
  cv: { label: 'Khaan Netra', short: 'AI vision', className: 'source-vision' },
  telemetry: { label: 'Sensor anomaly', short: 'Telemetry', className: 'source-sensor' },
  inspection: { label: 'Field inspection', short: 'Inspection', className: 'source-inspection' },
  manual: { label: 'Manual report', short: 'Manual', className: 'source-manual' },
};

function getSource(ticket) {
  const source = (ticket.source || '').toLowerCase();
  if (source.includes('cv') || source.includes('vision')) return sourceMeta.cv;
  if (source.includes('telemetry') || source.includes('sensor') || source.includes('rul')) return sourceMeta.telemetry;
  if (source.includes('inspection') || source.includes('cmrmc')) return sourceMeta.inspection;
  return sourceMeta.manual;
}

function formatAge(date) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function getSla(ticket) {
  const severity = (ticket.severity || '').toLowerCase();
  if (ticket.status === 'CLOSED') return { label: 'Resolved', tone: 'resolved' };
  if (severity === 'critical') return { label: '01h 42m left', tone: 'urgent' };
  if (severity === 'high') return { label: '06h 18m left', tone: 'warning' };
  return { label: '18h 40m left', tone: 'normal' };
}

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All severity');
  const [sourceFilter, setSourceFilter] = useState('All sources');
  const [view, setView] = useState('board');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const loadTickets = async () => {
    try {
      const response = await api.get('/api/tickets');
      setTickets(response.data.items || []);
      setError('');
    } catch {
      setError('Ticket service is unavailable. Start the backend to load the maintenance queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const moveTicket = async (ticket, status) => {
    try {
      const response = await api.patch(`/api/tickets/${ticket.id}`, { status, note: `Moved to ${status.toLowerCase()}.` });
      setTickets((items) => items.map((item) => item.id === ticket.id ? response.data : item));
    } catch {
      setError('The ticket could not be updated.');
    }
  };

  const assignTicket = async (assignee) => {
    if (!selectedTicket) return;
    setAssigning(true);
    try {
      const response = await api.patch(`/api/tickets/${selectedTicket.id}`, { assignee, note: `Assigned to ${assignee}.` });
      setTickets((items) => items.map((item) => item.id === selectedTicket.id ? response.data : item));
      setSelectedTicket(response.data);
    } catch {
      setError('The assignee could not be updated.');
    } finally {
      setAssigning(false);
    }
  };

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const source = getSource(ticket);
    const haystack = `${ticket.id} ${ticket.title} ${ticket.description} ${ticket.assignee}`.toLowerCase();
    return haystack.includes(query.toLowerCase())
      && (severityFilter === 'All severity' || ticket.severity?.toLowerCase() === severityFilter.toLowerCase())
      && (sourceFilter === 'All sources' || source.label === sourceFilter);
  }), [tickets, query, severityFilter, sourceFilter]);

  const stats = [
    { label: 'Total tickets', value: tickets.length, note: 'Across all work queues', tone: 'ink', icon: BarChart3 },
    { label: 'Needs assignment', value: tickets.filter((ticket) => ticket.status === 'OPEN').length, note: 'Awaiting trade owner', tone: 'amber', icon: UserRound },
    { label: 'In progress', value: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS' || ticket.status === 'ASSIGNED').length, note: 'Being worked in the field', tone: 'blue', icon: Wrench },
    { label: 'Verified closed', value: tickets.filter((ticket) => ticket.status === 'CLOSED').length, note: 'Resolution accepted', tone: 'green', icon: CheckCircle2 },
  ];

  const renderTicketCard = (ticket) => {
    const source = getSource(ticket);
    const sla = getSla(ticket);
    return <article className={`work-ticket-card priority-${ticket.severity}`} key={ticket.id} onClick={() => setSelectedTicket(ticket)}>
      <div className="work-ticket-topline"><span className="work-ticket-id">{ticket.id}</span><span className={`priority-pill ${ticket.severity}`}>{ticket.severity || 'medium'}</span></div>
      <h3>{ticket.title}</h3>
      <p>{ticket.description}</p>
      <div className="ticket-source-row"><span className={`source-tag ${source.className}`}><span />{source.short}</span><span className="ticket-location"><MapPin size={11} /> Panel 17 / Face #2</span></div>
      <div className="work-ticket-footer"><span className={`sla-chip ${sla.tone}`}><Clock3 size={12} /> {sla.label}</span><span className="ticket-assignee"><span className="mini-avatar">{ticket.assignee?.slice(0, 2).toUpperCase() || 'UN'}</span>{ticket.assignee || 'Unassigned'}</span></div>
    </article>;
  };

  return (
    <main className="tickets-workspace">
      <div className="tickets-hero"><div><div className="tickets-kicker"><span className="queue-live-dot" /> OPERATIONS / CORRECTIVE ACTIONS</div><h1>Work order desk</h1><p>Turn mine hazards into accountable, verified action.</p></div><div className="tickets-hero-actions"><div className="queue-health"><span /> Queue healthy <small>updated just now</small></div><a href="/telemetry" className="tickets-back-link"><BarChart3 size={15} /> Open telemetry</a></div></div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <section className="ticket-stat-grid">{stats.map(({ label, value, note, tone, icon: Icon }) => <article className={`ticket-stat tone-${tone}`} key={label}><div className="ticket-stat-icon"><Icon size={17} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>)}<article className="sla-watch-card"><div><span className="ticket-stat-eyebrow"><AlertTriangle size={13} /> SLA watch</span><strong>{tickets.filter((ticket) => getSla(ticket).tone === 'urgent').length || 0}</strong><small>critical tickets need attention</small></div><div className="sla-watch-ring"><span>24h</span></div></article></section>
      <section className="tickets-control-bar"><div className="ticket-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket, equipment, or hazard..." /></div><div className="ticket-filter"><Filter size={14} /><select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}><option>All severity</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><ChevronDown size={13} /></div><div className="ticket-filter"><SlidersHorizontal size={14} /><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option>All sources</option><option>Khaan Netra</option><option>Sensor anomaly</option><option>Field inspection</option><option>Manual report</option></select><ChevronDown size={13} /></div><div className="view-toggle"><button type="button" className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}><List size={15} /> Board</button><button type="button" className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><Table2 size={15} /> Table</button></div></section>
      {loading && <div className="ticket-empty-state">Loading work orders...</div>}
      {!loading && !error && tickets.length === 0 && <div className="ticket-empty-state"><ShieldAlert size={28} /><strong>No corrective tickets yet</strong><span>Inject a telemetry fault or submit a failed inspection to create one.</span></div>}
      {!loading && tickets.length > 0 && view === 'board' && <section className="work-order-board">{columns.map(([status, label]) => { const columnTickets = filteredTickets.filter((ticket) => ticket.status === status); return <div className={`work-order-column column-${status.toLowerCase()}`} key={status}><div className="work-column-heading"><div><span className="column-marker" /><h2>{label}</h2></div><strong>{columnTickets.length.toString().padStart(2, '0')}</strong></div><div className="work-column-body">{columnTickets.map(renderTicketCard)}{columnTickets.length === 0 && <p className="ticket-column-empty">No tickets in this queue</p>}</div></div>; })}</section>}
      {!loading && tickets.length > 0 && view === 'table' && <section className="ticket-table-panel"><div className="ticket-table-head"><span>Ticket / hazard</span><span>Origin</span><span>Severity</span><span>Owner</span><span>SLA</span><span>Status</span></div>{filteredTickets.map((ticket) => { const source = getSource(ticket); const sla = getSla(ticket); return <button type="button" className="ticket-table-row" key={ticket.id} onClick={() => setSelectedTicket(ticket)}><span><strong>{ticket.id}</strong><small>{ticket.title}</small></span><span><i className={`source-dot ${source.className}`} />{source.label}</span><span className={`priority-pill ${ticket.severity}`}>{ticket.severity}</span><span>{ticket.assignee || 'Unassigned'}</span><span className={`sla-chip ${sla.tone}`}>{sla.label}</span><span className="table-status">{ticket.status.replace('_', ' ')}</span></button>; })}</section>}
      <div className="tickets-footnote"><span><GitBranch size={13} /> Sources are preserved from the originating AI, telemetry, or inspection event.</span><span>{filteredTickets.length} of {tickets.length} tickets shown</span></div>
      {selectedTicket && <div className="ticket-drawer-backdrop" onClick={() => setSelectedTicket(null)}><aside className="ticket-detail-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><span className="work-ticket-id">{selectedTicket.id}</span><h2>{selectedTicket.title}</h2></div><button type="button" className="drawer-close" onClick={() => setSelectedTicket(null)} aria-label="Close ticket"><X size={18} /></button></div><div className="drawer-badges"><span className={`priority-pill ${selectedTicket.severity}`}>{selectedTicket.severity} priority</span><span className={`source-tag ${getSource(selectedTicket).className}`}><span /> {getSource(selectedTicket).label}</span><span className={`sla-chip ${getSla(selectedTicket).tone}`}><Clock3 size={12} /> {getSla(selectedTicket).label}</span></div><section className="drawer-section"><span className="drawer-label">Initial hazard description</span><p className="drawer-description">{selectedTicket.description}</p><div className="drawer-location"><MapPin size={14} /> Panel 17 · Longwall Face #2 <span>•</span> {formatAge(selectedTicket.created_at)}</div></section><section className="drawer-evidence"><div className="drawer-evidence-art"><Sparkles size={20} /><span>Origin evidence</span><small>{getSource(selectedTicket).label} snapshot attached</small></div><div><span className="drawer-label">Recommended control</span><p>Isolate the affected equipment, brief the shift team, and verify the condition at the gallery node before closure.</p></div></section><section className="drawer-section"><div className="drawer-section-heading"><span className="drawer-label">Assignment</span><span className="drawer-assignee"><UserRound size={13} /> Current: {selectedTicket.assignee || 'Unassigned'}</span></div><div className="drawer-assign-buttons"><button type="button" disabled={assigning} onClick={() => assignTicket('Electrical Response Team')}>Electrical</button><button type="button" disabled={assigning} onClick={() => assignTicket('Mechanical Response Team')}>Mechanical</button><button type="button" disabled={assigning} onClick={() => assignTicket('Safety Officer')}>Safety</button></div></section><section className="drawer-section"><div className="drawer-section-heading"><span className="drawer-label">Resolution workflow</span><select className="drawer-status-select" value={selectedTicket.status} onChange={(event) => moveTicket(selectedTicket, event.target.value)}>{columns.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div className="drawer-timeline">{(selectedTicket.timeline || []).slice().reverse().map((entry, index) => <div className="drawer-timeline-item" key={`${entry.at}-${index}`}><span className="timeline-node" /><div><strong>{entry.status.replace('_', ' ')}</strong><small>{new Date(entry.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</small><p>{entry.note}</p></div></div>)}</div></section><div className="drawer-actions"><button type="button" className="drawer-note-button"><MessageSquare size={14} /> Add field note</button><button type="button" className="drawer-verify-button" onClick={() => moveTicket(selectedTicket, 'VERIFICATION')}><CheckCircle2 size={14} /> Send for verification</button></div></aside></div>}
    </main>
  );
}
