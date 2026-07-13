import { useMemo } from 'react';

const WIDTH = 640;
const HEIGHT = 90;
const MAX_POINTS = 60;

export default function Oscilloscope({ samples, color = 'var(--amber-dim)' }) {
  const path = useMemo(() => {
    if (!samples.length) return '';
    const windowed = samples.slice(-MAX_POINTS);
    const max = Math.max(...windowed, 1) * 1.15;
    const stepX = WIDTH / (MAX_POINTS - 1);
    return windowed
      .map((v, i) => {
        const x = i * stepX;
        const y = HEIGHT - (v / max) * (HEIGHT - 10) - 5;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [samples]);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} preserveAspectRatio="none" aria-hidden="true">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={WIDTH} y1={HEIGHT * f} y2={HEIGHT * f} stroke="var(--paper-line)" strokeWidth="1" />
      ))}
      {path && <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  );
}
