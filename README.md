# Pulse — Connection Diagnostics

A speed test that reads download, upload, ping, and jitter, then translates
the numbers into plain language: what's this connection actually good for
right now (streaming, calls, gaming, uploads).


Runs entirely in the browser — no backend needed. It uses Cloudflare's
public speed-test endpoints (`speed.cloudflare.com/__down` and `/__up`,
the same ones behind speed.cloudflare.com) for download/upload, and a
zero-byte request to the same host for latency + jitter.

## Structure

- `src/lib/speedTest.js` — measurement engine (ping, download, upload)
- `src/lib/recommendations.js` — turns the numbers into the report
- `src/components/Gauge.jsx` — the analog needle instrument
- `src/components/Oscilloscope.jsx` — live trace during a test phase
- `src/App.jsx` — orchestrates the three test phases