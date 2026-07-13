import { useCallback, useRef, useState } from 'react';
import Gauge from './components/Gauge.jsx';
import Oscilloscope from './components/Oscilloscope.jsx';
import ResultsGrid from './components/ResultsGrid.jsx';
import ReportPanel from './components/ReportPanel.jsx';
import { measurePing, measureDownload, measureUpload } from './lib/speedTest.js';
import { buildReport } from './lib/recommendations.js';
import './App.css';

const PHASES = {
  IDLE: 'idle',
  PING: 'ping',
  DOWNLOAD: 'download',
  UPLOAD: 'upload',
  DONE: 'done',
  ERROR: 'error',
};

const PHASE_LABEL = {
  [PHASES.IDLE]: 'Ready when you are',
  [PHASES.PING]: 'Measuring latency\u2026',
  [PHASES.DOWNLOAD]: 'Measuring download\u2026',
  [PHASES.UPLOAD]: 'Measuring upload\u2026',
  [PHASES.DONE]: 'Test complete',
  [PHASES.ERROR]: 'Could not complete the test',
};

export default function App() {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [liveValue, setLiveValue] = useState(0);
  const [samples, setSamples] = useState([]);
  const [results, setResults] = useState({ download: null, upload: null, ping: null, jitter: null });
  const runId = useRef(0);

  const runTest = useCallback(async () => {
    const id = ++runId.current;
    setResults({ download: null, upload: null, ping: null, jitter: null });
    setSamples([]);
    setLiveValue(0);

    try {
      setPhase(PHASES.PING);
      const { ping, jitter } = await measurePing({
        onSample: (ms) => {
          if (runId.current !== id) return;
          setLiveValue(ms);
        },
      });
      if (runId.current !== id) return;
      setResults((r) => ({ ...r, ping, jitter }));
      setSamples([]);

      setPhase(PHASES.DOWNLOAD);
      const download = await measureDownload({
        onSample: (mbps) => {
          if (runId.current !== id) return;
          setLiveValue(mbps);
          setSamples((s) => [...s, mbps]);
        },
      });
      if (runId.current !== id) return;
      setResults((r) => ({ ...r, download }));
      setSamples([]);

      setPhase(PHASES.UPLOAD);
      const upload = await measureUpload({
        onSample: (mbps) => {
          if (runId.current !== id) return;
          setLiveValue(mbps);
          setSamples((s) => [...s, mbps]);
        },
      });
      if (runId.current !== id) return;
      setResults((r) => ({ ...r, upload }));

      setPhase(PHASES.DONE);
    } catch (e) {
      if (runId.current === id) setPhase(PHASES.ERROR);
    }
  }, []);

  const running = phase !== PHASES.IDLE && phase !== PHASES.DONE && phase !== PHASES.ERROR;
  const report = phase === PHASES.DONE ? buildReport(results) : null;

  const gaugeUnit = phase === PHASES.PING ? 'ms' : 'Mbps';
  const gaugeLabel =
    phase === PHASES.PING ? 'Latency' : phase === PHASES.UPLOAD ? 'Upload' : 'Download';
  const gaugeValue = running
    ? liveValue
    : phase === PHASES.DONE
    ? results.download
    : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="eyebrow">Connection diagnostics</span>
        <h1 className="title">Pulse</h1>
        <p className="subtitle">A straight read on what your connection can actually do.</p>
      </header>

      <main className="instrument-panel">
        <div className="gauge-row">
          <Gauge value={gaugeValue} label={gaugeLabel} unit={gaugeUnit} maxHint={results.download || 100} />
        </div>

        <div className="phase-line">
          <span className={`phase-dot phase-dot--${phase}`} />
          {PHASE_LABEL[phase]}
        </div>

        <div className="trace-strip">
          <Oscilloscope samples={samples} />
        </div>

        <button className="run-button" onClick={runTest} disabled={running}>
          {phase === PHASES.DONE ? 'Run again' : running ? 'Testing\u2026' : 'Start test'}
        </button>

        {phase === PHASES.ERROR && (
          <p className="error-copy">
            The test couldn't reach the measurement server. Check your connection and try again.
          </p>
        )}

        {(phase === PHASES.DONE || results.ping != null) && (
          <ResultsGrid
            download={results.download}
            upload={results.upload}
            ping={results.ping}
            jitter={results.jitter}
          />
        )}
      </main>

      {report && <ReportPanel report={report} />}

      <footer className="app-footer">Measurements run directly from your browser to the test server — nothing is stored.</footer>
    </div>
  );
}
