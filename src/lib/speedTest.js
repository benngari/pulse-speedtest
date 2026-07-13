// Measurement engine. Runs entirely in the browser — no backend required.
// Uses Cloudflare's public speed-test endpoints (the same ones that power
// speed.cloudflare.com) which accept cross-origin requests.

const DOWN_URL = (bytes) => `https://speed.cloudflare.com/__down?bytes=${bytes}`;
const UP_URL = 'https://speed.cloudflare.com/__up';

function now() {
  return performance.now();
}

// --- Ping + jitter -----------------------------------------------------
export async function measurePing({ samples = 6, onSample } = {}) {
  const times = [];
  for (let i = 0; i < samples; i++) {
    const start = now();
    try {
      await fetch(DOWN_URL(0), { cache: 'no-store', mode: 'cors' });
    } catch (e) {
      continue;
    }
    const elapsed = now() - start;
    times.push(elapsed);
    onSample?.(elapsed);
    await new Promise((r) => setTimeout(r, 80));
  }
  if (times.length === 0) throw new Error('ping-failed');

  const ping = Math.min(...times);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const jitter =
    times.reduce((sum, t) => sum + Math.abs(t - mean), 0) / times.length;

  return { ping, jitter };
}

// --- Download ------------------------------------------------------------
// Downloads progressively larger chunks, sampling instantaneous throughput
// as bytes arrive so the UI can animate a live needle + trace.
export async function measureDownload({ onSample, durationMs = 6000 } = {}) {
  const chunkSizes = [2_000_000, 5_000_000, 10_000_000, 25_000_000, 25_000_000, 25_000_000];
  const testStart = now();
  let totalBytes = 0;

  for (const size of chunkSizes) {
    if (now() - testStart > durationMs) break;

    const chunkStart = now();
    let chunkBytes = 0;
    let lastSampleTime = chunkStart;
    let lastSampleBytes = 0;

    const res = await fetch(DOWN_URL(size), { cache: 'no-store', mode: 'cors' });
    const reader = res.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunkBytes += value.length;
      totalBytes += value.length;

      const t = now();
      if (t - lastSampleTime > 150) {
        const intervalBytes = totalBytes - lastSampleBytes;
        const intervalSec = (t - lastSampleTime) / 1000;
        const mbps = (intervalBytes * 8) / intervalSec / 1_000_000;
        onSample?.(mbps);
        lastSampleTime = t;
        lastSampleBytes = totalBytes;
      }

      if (t - testStart > durationMs) {
        reader.cancel();
        break;
      }
    }
  }

  const totalSec = (now() - testStart) / 1000;
  return (totalBytes * 8) / totalSec / 1_000_000; // Mbps
}

// --- Upload ---------------------------------------------------------------
export async function measureUpload({ onSample, durationMs = 5000 } = {}) {
  const blobSize = 4_000_000;
  const blob = new Blob([new Uint8Array(blobSize)]);
  const testStart = now();
  let totalBytes = 0;

  while (now() - testStart < durationMs) {
    const chunkStart = now();
    await fetch(UP_URL, { method: 'POST', body: blob, mode: 'cors' });
    const chunkElapsed = (now() - chunkStart) / 1000;
    totalBytes += blobSize;

    const mbps = (blobSize * 8) / chunkElapsed / 1_000_000;
    onSample?.(mbps);
  }

  const totalSec = (now() - testStart) / 1000;
  return (totalBytes * 8) / totalSec / 1_000_000; // Mbps
}
