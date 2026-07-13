import { useEffect, useState } from 'react';

export default function ISPInfo() {
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('bad-response');
        const data = await res.json();
        if (cancelled) return;
        setInfo({
          ip: data.ip,
          isp: data.org || 'Unknown provider',
          city: data.city,
          region: data.region,
          country: data.country_name,
        });
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="isp-card">
      <div className="isp-dot" data-status={status} />
      <div className="isp-body">
        {status === 'loading' && <span className="isp-line">Looking up your connection…</span>}
        {status === 'error' && <span className="isp-line">Couldn't detect ISP details.</span>}
        {status === 'ready' && info && (
          <>
            <span className="isp-provider">{info.isp}</span>
            <span className="isp-meta">
              {info.ip}
              {info.city ? ` · ${info.city}, ${info.country}` : info.country ? ` · ${info.country}` : ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}