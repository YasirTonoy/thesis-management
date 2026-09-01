import React, { useState, useRef } from 'react';

/**
 * Hand-rolled SVG charts, kept dependency-free to match the rest of the app.
 *
 * Palette notes: magnitude is encoded by bar length, so every magnitude mark uses a
 * single blue (#2a78d6, the one blue step clearing 3:1 on white). Status marks use the
 * reserved status palette, which fails red/green CVD separation on its own — so every
 * status mark here carries an icon and a text label and never relies on colour alone.
 */
export const VIZ = {
  accent: '#2a78d6',
  accentSoft: 'rgba(42, 120, 214, 0.12)',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  grid: '#e2e8f0',
  axis: '#cbd5e1',
  track: '#eef2f7',
  muted: '#64748b'
};

export const STATUS_MARKS = {
  good: { color: VIZ.good, icon: '✓' },
  warning: { color: VIZ.warning, icon: '!' },
  critical: { color: VIZ.critical, icon: '✕' }
};

export const StatTile = ({ label, value, sub, tone }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
    <p className="text-3xl font-bold text-slate-900 mt-1.5 leading-none">{value}</p>
    {sub && (
      <p className="text-xs mt-1.5" style={{ color: tone ? STATUS_MARKS[tone]?.color : VIZ.muted }}>
        {tone && <span className="font-bold mr-1">{STATUS_MARKS[tone]?.icon}</span>}
        {sub}
      </p>
    )}
  </div>
);

/** Single-series area chart with a crosshair + tooltip. One series, so no legend box. */
export const AreaChart = ({ data, xKey = 'label', yKey = 'count', height = 220 }) => {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);

  const W = 720;
  const H = height;
  const PAD = { top: 16, right: 12, bottom: 28, left: 34 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.map((d) => d[yKey]), 1);
  const stepX = data.length > 1 ? plotW / (data.length - 1) : plotW;
  const px = (i) => PAD.left + i * stepX;
  const py = (v) => PAD.top + plotH - (v / max) * plotH;

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(d[yKey])}`).join(' ');
  const area = `${line} L ${px(data.length - 1)} ${PAD.top + plotH} L ${px(0)} ${PAD.top + plotH} Z`;
  const ticks = [0, Math.round(max / 2), max];

  const handleMove = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const xInSvg = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round((xInSvg - PAD.left) / stepX);
    setHover(idx >= 0 && idx < data.length ? idx : null);
  };

  return (
    <div className="relative" ref={wrapRef} onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label="Theses submitted per month">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={py(t)} y2={py(t)} stroke={VIZ.grid} strokeWidth="1" />
            <text x={PAD.left - 8} y={py(t) + 4} textAnchor="end" fontSize="11" fill={VIZ.muted}>{t}</text>
          </g>
        ))}

        <path d={area} fill={VIZ.accentSoft} />
        <path d={line} fill="none" stroke={VIZ.accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => (
          <text key={d[xKey] + i} x={px(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={VIZ.muted}>
            {d[xKey]}
          </text>
        ))}

        {hover !== null && (
          <g>
            <line x1={px(hover)} x2={px(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke={VIZ.axis} strokeWidth="1" />
            <circle cx={px(hover)} cy={py(data[hover][yKey])} r="5" fill="#ffffff" stroke={VIZ.accent} strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover !== null && (
        <div
          className="absolute pointer-events-none bg-slate-900 text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg whitespace-nowrap"
          style={{ left: `${(px(hover) / W) * 100}%`, top: 4, transform: 'translateX(-50%)' }}
        >
          <span className="font-semibold">{data[hover][yKey]}</span> in {data[hover][xKey]} {data[hover].year || ''}
        </div>
      )}
    </div>
  );
};

/** Horizontal magnitude bars — length carries the value, so all bars share one hue. */
export const BarList = ({ items, valueKey = 'value', labelKey = 'label', tone, labelClass = 'w-40', emptyText = 'No data yet.' }) => {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">{emptyText}</p>;

  const max = Math.max(...items.map((i) => i[valueKey]), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const mark = tone ? STATUS_MARKS[item.severity] : null;
        const color = mark ? mark.color : VIZ.accent;
        const pct = (item[valueKey] / max) * 100;

        return (
          <div key={`${item[labelKey]}-${idx}`} className="flex items-center gap-3 group">
            <div className={`${labelClass} shrink-0 text-xs text-slate-600 truncate flex items-center gap-1.5`} title={item[labelKey]}>
              {mark && <span className="font-bold" style={{ color: mark.color }}>{mark.icon}</span>}
              {item[labelKey]}
            </div>
            <div className="flex-1 h-2.5 rounded-full" style={{ backgroundColor: VIZ.track }}>
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${Math.max(pct, item[valueKey] > 0 ? 3 : 0)}%`, backgroundColor: color }}
              />
            </div>
            <div className="w-16 shrink-0 text-xs font-semibold text-slate-900 text-right tabular-nums">
              {item[valueKey]}
              {item.suffix || ''}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Part-to-whole bar. Status colours, so each segment is also named in the legend. */
export const StackedStatusBar = ({ segments }) => {
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <div className="flex gap-0.5 h-4 rounded-full overflow-hidden" style={{ backgroundColor: VIZ.track }}>
        {total > 0 &&
          segments
            .filter((s) => s.count > 0)
            .map((s) => (
              <div
                key={s.label}
                style={{ width: `${(s.count / total) * 100}%`, backgroundColor: STATUS_MARKS[s.severity].color }}
                title={`${s.label}: ${s.count}`}
              />
            ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className="font-bold" style={{ color: STATUS_MARKS[s.severity].color }}>{STATUS_MARKS[s.severity].icon}</span>
            <span className="text-slate-600">{s.label}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{s.count}</span>
            {total > 0 && <span className="text-slate-400">({Math.round((s.count / total) * 100)}%)</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Single ratio against a limit — a meter, not a one-slice pie. */
export const Meter = ({ value, label, sub }) => (
  <div>
    <div className="flex justify-between items-baseline mb-2">
      <span className="text-3xl font-bold text-slate-900 leading-none">{value}%</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
    <div className="h-2.5 rounded-full" style={{ backgroundColor: VIZ.track }}>
      <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: VIZ.accent }} />
    </div>
    {sub && <p className="text-xs text-slate-500 mt-2">{sub}</p>}
  </div>
);

export const ChartCard = ({ title, subtitle, children, action }) => (
  <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
    <div className="flex justify-between items-start gap-3 mb-4">
      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);
