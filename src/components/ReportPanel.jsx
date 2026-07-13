const STATUS_COLOR = {
  good: 'var(--teal)',
  warn: 'var(--amber-dim)',
  bad: 'var(--red)',
};

const STATUS_MARK = {
  good: '\u25CF', // filled circle
  warn: '\u25D0', // half circle
  bad: '\u25CB', // hollow circle
};

export default function ReportPanel({ report }) {
  if (!report) return null;

  return (
    <div className="report-panel">
      <div className="report-header">
        <span className="report-eyebrow">Diagnostic report</span>
        <h3 className="report-headline">{report.headline}</h3>
      </div>
      <ul className="report-list">
        {report.items.map((item) => (
          <li key={item.key} className="report-row">
            <span className="report-mark" style={{ color: STATUS_COLOR[item.status] }} aria-hidden="true">
              {STATUS_MARK[item.status]}
            </span>
            <div>
              <div className="report-title">{item.title}</div>
              <div className="report-copy">{item.label}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
