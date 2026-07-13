export default function ResultsGrid({ download, upload, ping, jitter }) {
  const rows = [
    { label: 'Download', value: download, unit: 'Mbps' },
    { label: 'Upload', value: upload, unit: 'Mbps' },
    { label: 'Ping', value: ping, unit: 'ms' },
    { label: 'Jitter', value: jitter, unit: 'ms' },
  ];

  return (
    <div className="results-grid">
      {rows.map((r) => (
        <div className="result-cell" key={r.label}>
          <div className="result-value">{r.value != null ? r.value.toFixed(1) : '—'}</div>
          <div className="result-meta">
            <span className="result-unit">{r.unit}</span>
            <span className="result-label">{r.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
