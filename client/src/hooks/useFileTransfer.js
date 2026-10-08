import { useRef, useEffect } from 'react';

// Ephemeral P2P file transfer over the 'files' data channels that ride the
// voice PCs. Nothing is ever written to disk or stored server-side: chunks
// live in page memory only, so a refresh destroys partials and completed
// blobs alike. One transfer runs at a time (queue); recipients snapshot the
// open channels at send start (late joiners never catch up — same privacy
// rule as chat: no history replay).
//
// Wire protocol on a channel (ordered + reliable, so framing is positional):
//   {"t":"start","id","name","size","mime"}   text
//   <ArrayBuffer × N>                          64 KB binary chunks
//   {"t":"end","id"}                           text
//   {"t":"ack","id"}                           text  receiver -> sender
//   {"t":"cancel","id"}                        text  either direction

export const MAX_FILE_SIZE = 200 * 1024 * 1024;

const CHUNK_SIZE = 64 * 1024;
const DRAIN_HIGH = 16 * 1024 * 1024; // pause fan-out when any channel buffers this much
const PROGRESS_INTERVAL_MS = 150;
const ACK_TIMEOUT_MS = 30000;
const DRAIN_WAIT_TIMEOUT_MS = 5000;

function whenWritable(dc) {
  if (dc.bufferedAmount <= DRAIN_HIGH) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      dc.removeEventListener('bufferedamountlow', finish);
      dc.removeEventListener('close', finish);
      resolve();
    };
    const timer = setTimeout(finish, DRAIN_WAIT_TIMEOUT_MS);
    dc.addEventListener('bufferedamountlow', finish);
    dc.addEventListener('close', finish);
  });
}

function createCore(fileChannelsRef, cbRef) {
  const queue = [];
  let active = null;
  const incoming = new Map(); // peerId -> {id, name, size, mime, parts, received, lastNotify}
  const urls = new Set(); // object URLs we minted (revoked on leave)
  const bound = new WeakSet();
  let aborted = false;

  const notify = () => cbRef.current;

  const sendControl = (dc, obj) => {
    if (dc.readyState !== 'open') return;
    try {
      dc.send(JSON.stringify(obj));
    } catch {
      /* channel raced closed — close handler resolves the peer */
    }
  };

  // ── receive path ──────────────────────────────────────────
  const handleIncomingStart = (peerId, msg) => {
    const existing = incoming.get(peerId);
    if (existing) notify().onUpdate(existing.id, { state: 'interrupted' });
    const meta = {
      id: String(msg.id || ''),
      name: String(msg.name || 'file'),
      size: Number(msg.size) || 0,
      mime: String(msg.mime || 'application/octet-stream'),
    };
    if (!meta.id) return;
    incoming.set(peerId, { ...meta, parts: [], received: 0, lastNotify: 0 });
    notify().onIncoming({ peerId, ...meta });
  };

  const completeIncoming = (peerId) => {
    const inc = incoming.get(peerId);
    if (!inc) return;
    incoming.delete(peerId);
    try {
      const blob = new Blob(inc.parts, { type: inc.mime });
      const url = URL.createObjectURL(blob);
      urls.add(url);
      notify().onUpdate(inc.id, { state: 'ready', progress: 1, url });
      // confirm assembly so the sender can mark this peer delivered
      sendControl(fileChannelsRef.current.get(peerId), { t: 'ack', id: inc.id });
    } catch (err) {
      console.error('[files] blob assembly failed', err);
      notify().onUpdate(inc.id, { state: 'failed' });
    }
  };

  const discardIncoming = (peerId, state) => {
    const inc = incoming.get(peerId);
    if (!inc) return;
    incoming.delete(peerId);
    notify().onUpdate(inc.id, { state });
  };

  // ── outgoing path ─────────────────────────────────────────
  const pendingPeers = (a) => [...a.peers.values()].filter((p) => p.state === 'pending');
  const allResolved = (a) => pendingPeers(a).length === 0;
  const ackedCount = (a) => [...a.peers.values()].filter((p) => p.state === 'acked').length;

  const finalize = (a, state) => {
    if (a.phase === 'done') return;
    a.phase = 'done';
    clearTimeout(a.ackTimer);
    if (active === a) active = null;
    const patch = {
      state,
      peersDone: ackedCount(a),
      peersTotal: a.peers.size,
    };
    if (state === 'ready') patch.progress = 1;
    notify().onUpdate(a.id, patch);
    pump();
  };

  const maybeFinalizeAcks = (a) => {
    if (a.phase !== 'acks') return;
    if (!allResolved(a)) return;
    const done = ackedCount(a);
    finalize(a, a.canceled ? 'canceled' : done > 0 ? 'ready' : 'failed');
  };

  const notifyOutProgress = (a) => {
    const now = Date.now();
    if (now - a.lastNotify < PROGRESS_INTERVAL_MS) return;
    a.lastNotify = now;
    const list = pendingPeers(a);
    const watched = list.length ? list : [...a.peers.values()];
    const minSent = Math.min(...watched.map((p) => p.sent));
    notify().onUpdate(a.id, { progress: a.size ? Math.min(1, minSent / a.size) : 1 });
  };

  async function runActive(a) {
    a.phase = 'loop';
    for (const p of a.peers.values()) {
      sendControl(p.dc, { t: 'start', id: a.id, name: a.name, size: a.size, mime: a.mime });
    }

    let offset = 0;
    while (offset < a.size && !a.canceled && !allResolved(a)) {
      const end = Math.min(offset + CHUNK_SIZE, a.size);
      let buf;
      try {
        buf = await a.file.slice(offset, end).arrayBuffer();
      } catch (err) {
        console.error('[files] read failed', err);
        for (const p of pendingPeers(a)) p.state = 'failed';
        break;
      }
      offset = end;
      for (const p of a.peers.values()) {
        if (p.state !== 'pending' || a.canceled) continue;
        if (p.dc.readyState !== 'open') {
          p.state = 'failed';
          continue;
        }
        await whenWritable(p.dc);
        if (p.dc.readyState !== 'open') {
          p.state = 'failed';
          continue;
        }
        try {
          p.dc.send(buf);
          p.sent += buf.byteLength;
        } catch {
          p.state = 'failed';
        }
      }
      notifyOutProgress(a);
    }

    if (a.canceled) {
      for (const p of a.peers.values()) sendControl(p.dc, { t: 'cancel', id: a.id });
      finalize(a, 'canceled');
      return;
    }

    a.phase = 'acks';
    for (const p of pendingPeers(a)) sendControl(p.dc, { t: 'end', id: a.id });
    if (a.canceled) {
      finalize(a, 'canceled');
      return;
    }
    a.ackTimer = setTimeout(() => {
      for (const p of pendingPeers(a)) p.state = 'failed';
      maybeFinalizeAcks(a);
    }, ACK_TIMEOUT_MS);
    maybeFinalizeAcks(a);
  }

  function pump() {
    if (aborted || active || queue.length === 0) return;
    const job = queue.shift();
    const peers = new Map();
    fileChannelsRef.current.forEach((dc, peerId) => {
      if (dc.readyState === 'open') peers.set(peerId, { dc, sent: 0, state: 'pending' });
    });
    if (peers.size === 0) {
      notify().onUpdate(job.id, { state: 'failed', peersDone: 0, peersTotal: 0 });
      pump();
      return;
    }
    const a = {
      ...job,
      peers,
      canceled: false,
      phase: 'loop',
      lastNotify: 0,
      ackTimer: null,
    };
    active = a;
    notify().onUpdate(job.id, { state: 'sending', progress: 0, peersTotal: peers.size, peersDone: 0 });
    runActive(a).catch((err) => {
      console.error('[files] send failed', err);
      finalize(a, 'failed');
    });
  }

  // ── channel events ────────────────────────────────────────
  const onMessage = (peerId, data) => {
    if (aborted) return;
    if (typeof data === 'string') {
      let msg;
      try {
        msg = JSON.parse(data);
      } catch {
        return;
      }
      if (msg.t === 'start') handleIncomingStart(peerId, msg);
      else if (msg.t === 'end') completeIncoming(peerId);
      else if (msg.t === 'cancel') discardIncoming(peerId, 'canceled');
      else if (msg.t === 'ack') {
        const a = active;
        if (!a || a.id !== msg.id || a.phase !== 'acks') return;
        const p = a.peers.get(peerId);
        if (p && p.state === 'pending') {
          p.state = 'acked';
          notify().onUpdate(a.id, { peersDone: ackedCount(a) });
          maybeFinalizeAcks(a);
        }
      }
      return;
    }
    const inc = incoming.get(peerId);
    if (!inc) return; // chunk without start (late joiner) — ignore
    const part = data instanceof Blob ? data : new Blob([data]);
    inc.parts.push(part);
    inc.received += part.size;
    const now = Date.now();
    if (inc.size > 0 && (now - inc.lastNotify >= PROGRESS_INTERVAL_MS || inc.received >= inc.size)) {
      inc.lastNotify = now;
      notify().onUpdate(inc.id, { progress: Math.min(1, inc.received / inc.size) });
    }
  };

  const onChannelClose = (peerId) => {
    discardIncoming(peerId, 'interrupted');
    const a = active;
    if (!a || a.phase === 'done') return;
    const p = a.peers.get(peerId);
    if (p && p.state === 'pending') {
      p.state = 'failed';
      if (a.phase === 'acks') maybeFinalizeAcks(a);
    }
  };

  const bind = (peerId, dc) => {
    if (bound.has(dc)) return;
    bound.add(dc);
    dc.binaryType = 'arraybuffer';
    dc.addEventListener('message', (ev) => onMessage(peerId, ev.data));
    dc.addEventListener('close', () => onChannelClose(peerId));
  };

  // ── public API ────────────────────────────────────────────
  const sendFile = (file, id) => {
    aborted = false;
    queue.push({
      id,
      file,
      name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream',
    });
    notify().onUpdate(id, { state: 'queued', progress: 0, peersDone: 0, peersTotal: 0 });
    pump();
  };

  const cancelSend = (id) => {
    const qi = queue.findIndex((j) => j.id === id);
    if (qi >= 0) {
      queue.splice(qi, 1);
      notify().onUpdate(id, { state: 'canceled' });
      return;
    }
    const a = active;
    if (!a || a.id !== id || a.phase === 'done') return;
    a.canceled = true;
    if (a.phase === 'acks') finalize(a, 'canceled');
    // loop phase: the runActive loop notices, sends cancel frames, finalizes
  };

  const cancelIncoming = (id) => {
    for (const [peerId, inc] of incoming.entries()) {
      if (inc.id !== id) continue;
      sendControl(fileChannelsRef.current.get(peerId), { t: 'cancel', id });
      incoming.delete(peerId);
      notify().onUpdate(id, { state: 'canceled' });
      return;
    }
  };

  const abortAll = () => {
    aborted = true;
    queue.length = 0;
    if (active && active.phase !== 'done') {
      active.canceled = true;
      for (const p of active.peers.values()) sendControl(p.dc, { t: 'cancel', id: active.id });
      if (active.phase === 'acks') finalize(active, 'canceled');
    }
    incoming.clear();
    urls.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {
        /* already gone */
      }
    });
    urls.clear();
  };

  return { bind, sendFile, cancelSend, cancelIncoming, abortAll };
}

export function useFileTransfer(fileChannelsRef, registerFileChannelHandler, callbacks) {
  const cbRef = useRef(callbacks);
  const coreRef = useRef(null);
  if (!coreRef.current) coreRef.current = createCore(fileChannelsRef, cbRef);

  // keep callbacks fresh without recreating the core (events read cbRef.current)
  useEffect(() => {
    cbRef.current = callbacks;
  });

  const core = coreRef.current;
  useEffect(() => {
    registerFileChannelHandler(core.bind);
    return () => registerFileChannelHandler(null);
  }, [registerFileChannelHandler, core]);

  return core;
}
