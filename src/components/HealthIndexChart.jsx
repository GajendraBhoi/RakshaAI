import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })
}

function HealthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = Number(payload[0].value)
  const status = value >= 70 ? 'Critical' : value >= 35 ? 'Warning' : 'Normal'
  return <div className="chart-tooltip"><strong>{value.toFixed(1)}%</strong><span>{formatTime(label)} · {status}</span></div>
}

export default function HealthIndexChart({ history, healthIndex }) {
  const data = history.map((point) => ({ ...point, label: point.timestamp.getTime() }))
  const status = healthIndex >= 0.7 ? 'critical' : healthIndex >= 0.35 ? 'warning' : 'normal'

  return <section className={`panel health-index-panel health-index-${status}`} aria-label="Pump P-104 Health Index trend">
    <div className="panel-heading">
      <div><p className="eyebrow">Predict · aggregate signal</p><h2>Health Index</h2></div>
      <strong className="health-index-current">{Math.round(healthIndex * 100)}%</strong>
    </div>
    <div className="health-index-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs><linearGradient id="healthIndexFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2b8def" stopOpacity={0.24} /><stop offset="100%" stopColor="#2b8def" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke="#edf1f4" vertical={false} />
          <XAxis dataKey="label" type="number" domain={data.length ? ['dataMin', 'dataMax'] : [0, 1]} tickFormatter={formatTime} axisLine={false} tickLine={false} tick={{ fill: '#8b98a9', fontSize: 10 }} minTickGap={32} />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} tick={{ fill: '#8b98a9', fontSize: 10 }} width={36} />
          <ReferenceLine y={35} stroke="#c88216" strokeDasharray="3 3" label={{ value: 'Warning', fill: '#c88216', fontSize: 10, position: 'insideBottomRight' }} />
          <ReferenceLine y={70} stroke="#d34b53" strokeDasharray="3 3" label={{ value: 'Critical', fill: '#d34b53', fontSize: 10, position: 'insideTopRight' }} />
          <Tooltip content={<HealthTooltip />} />
          <Area type="monotone" dataKey="value" stroke={status === 'critical' ? '#d34b53' : status === 'warning' ? '#c88216' : '#2b8def'} fill="url(#healthIndexFill)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </section>
}
