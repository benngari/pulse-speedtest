// Turns raw download / upload / ping / jitter numbers into a plain-language
// report: what this connection is actually good for, right now.

function rate(value, tiers) {
  // tiers: [{ min, label, status }] sorted descending by min
  for (const tier of tiers) {
    if (value >= tier.min) return tier;
  }
  return tiers[tiers.length - 1];
}

export function buildReport({ download, upload, ping, jitter }) {
  const streaming = rate(download, [
    { min: 100, status: 'good', label: '4K streaming on several screens at once, no problem.' },
    { min: 25, status: 'good', label: 'Smooth HD streaming, even with a couple of devices going.' },
    { min: 5, status: 'warn', label: 'SD streaming is fine, but HD may buffer if others are online too.' },
    { min: 0, status: 'bad', label: 'Streaming will likely stall. Stick to audio or low-res video.' },
  ]);

  const calls = rate(Math.min(download, upload * 2.5), [
    { min: 10, status: 'good', label: 'Group video calls will run crisp and stable.' },
    { min: 3, status: 'warn', label: 'One-on-one calls are fine; group calls may drop in quality.' },
    { min: 0, status: 'bad', label: 'Video calls will likely be choppy — consider audio-only.' },
  ]);

  // Ping is "lower is better" so it needs its own ascending check
  // rather than the descending `rate()` helper used above.
  const gamingReport = (() => {
    if (ping < 30 && jitter < 10) return { status: 'good', label: 'Low, stable latency — competitive online gaming will feel responsive.' };
    if (ping < 60 && jitter < 20) return { status: 'warn', label: 'Casual gaming is fine; fast-paced competitive play may show occasional lag.' };
    return { status: 'bad', label: 'Latency is high enough that real-time gaming will feel laggy.' };
  })();

  const uploads = rate(upload, [
    { min: 10, status: 'good', label: 'Uploading large files or backing up to the cloud will be quick.' },
    { min: 3, status: 'warn', label: 'Uploads work, but large files (photos, videos) will take a while.' },
    { min: 0, status: 'bad', label: 'Uploading anything sizeable will be slow going.' },
  ]);

  const items = [
    { key: 'streaming', title: 'Streaming', ...streaming },
    { key: 'calls', title: 'Video calls', ...calls },
    { key: 'gaming', title: 'Online gaming', ...gamingReport },
    { key: 'uploads', title: 'Uploads & backups', ...uploads },
  ];

  const overallScore = items.filter((i) => i.status === 'good').length;
  let headline;
  if (overallScore >= 3) headline = 'This connection is in great shape.';
  else if (overallScore >= 2) headline = 'This connection handles the everyday stuff well, with some limits.';
  else headline = 'This connection is a bottleneck for anything demanding.';

  return { headline, items };
}
