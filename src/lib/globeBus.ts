// Tiny message bus so the Roll island can drive the separate Globe island.
export type GlobeMsg = { mode: 'idle' | 'spin' | 'focus'; lat?: number; lng?: number; label?: string };
const EVT = 'triproll:globe';

export function emitGlobe(msg: GlobeMsg) {
  (window as unknown as { __triprollGlobe?: GlobeMsg }).__triprollGlobe = msg;
  window.dispatchEvent(new CustomEvent<GlobeMsg>(EVT, { detail: msg }));
}
export function lastGlobe(): GlobeMsg | undefined {
  return (window as unknown as { __triprollGlobe?: GlobeMsg }).__triprollGlobe;
}
export function onGlobe(fn: (m: GlobeMsg) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<GlobeMsg>).detail);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
