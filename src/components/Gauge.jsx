import { useMemo } from 'react';

// Sweeps from -120deg to +120deg across a log-ish scale so both a 3 Mbps
// and a 300 Mbps connection produce a readable needle position.
const START_ANGLE = -120;
const END_ANGLE = 120;

function scaleFor(maxObservedMbps) {
  if (maxObservedMbps > 300) return 1000;
  if (maxObservedMbps > 150) return 500;
  if (maxObservedMbps > 60) return 200;
  if (maxObservedMbps > 20) return 100;
  return 50;
}

function angleForValue(value, max) {
  const clamped = Math.max(0, Math.min(value, max));
  // gentle log curve so low speeds aren't all crammed at the start
  const t = Math.log(clamped + 1) / Math.log(max + 1);
  return START_ANGLE + t * (END_ANGLE - START_ANGLE);
}

export default function Gauge({ value, label, unit = 'Mbps', maxHint }) {
  const max = useMemo(() => scaleFor(Math.max(maxHint || 0, value || 0)), [maxHint, value]);
  const angle = angleForValue(value || 0, max);

  const ticks = useMemo(() => {
    const count = 9;
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const a = START_ANGLE + t * (END_ANGLE - START_ANGLE);
      const tickValue = Math.round((Math.exp(t * Math.log(max + 1)) - 1));
      return { angle: a, value: tickValue };
    });
  }, [max]);

  const cx = 130, cy = 140, rOuter = 108, rTickIn = 92, rLabel = 74;

  const polar = (angleDeg, r) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <svg viewBox="0 0 260 210" width="260" height="210" role="img" aria-label={`${label}: ${value?.toFixed(1) ?? '0'} ${unit}`}>
      <path
        d={describeArc(cx, cy, rOuter, START_ANGLE, END_ANGLE)}
        fill="none"
        stroke="var(--paper-line)"
        strokeWidth="2"
      />
      {ticks.map((t, i) => {
        const p1 = polar(t.angle, rTickIn);
        const p2 = polar(t.angle, rOuter);
        const lp = polar(t.angle, rLabel);
        return (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--ink-soft)" strokeWidth="1.5" />
            <text x={lp.x} y={lp.y} fontSize="9" fontFamily="var(--mono)" fill="var(--ink-soft)" textAnchor="middle" dominantBaseline="middle">
              {t.value}
            </text>
          </g>
        );
      })}
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - rOuter + 14} stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r="6" fill="var(--ink)" />

      <text x={cx} y={cy + 40} textAnchor="middle" fontFamily="var(--mono)" fontSize="26" fontWeight="600" fill="var(--ink)">
        {value ? value.toFixed(1) : '—'}
      </text>
      <text x={cx} y={cy + 58} textAnchor="middle" fontFamily="var(--body)" fontSize="11" letterSpacing="0.08em" fill="var(--ink-soft)">
        {unit.toUpperCase()}
      </text>
      <text x={cx} y={190} textAnchor="middle" fontFamily="var(--display)" fontSize="13" fontWeight="600" fill="var(--ink)">
        {label}
      </text>
    </svg>
  );
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const polar = (angleDeg) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = polar(startAngle);
  const end = polar(endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
