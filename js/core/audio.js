// One shared <audio>. Only entries with verified recording URLs (Quran, Mishary Alafasy via Islamic Network CDN) can play.
import { toast } from './dom.js';
let el = null, current = null, queue = [], listeners = new Set();
export const onAudio = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => fn(current));
export const playingId = () => current;
export function stop() { if (el) { el.pause(); el.removeAttribute('src'); el.load(); } queue = []; current = null; emit(); }
export function toggle(entry) {
  if (current === entry.id) return stop();
  stop();
  const urls = entry.audio_urls?.length ? entry.audio_urls : entry.audio_url ? [entry.audio_url] : [];
  if (!urls.length) { toast('No verified recording is available for this dua yet.'); return; }
  if (!el) {
    el = new Audio();
    el.preload = 'none';
    el.addEventListener('ended', () => { if (queue.length) { el.src = queue.shift(); el.play().catch(fail); } else { current = null; emit(); } });
    el.addEventListener('error', () => { if (current) fail(); });
  }
  queue = urls.slice(1); current = entry.id;
  el.src = urls[0];
  emit();
  if (entry.audio_partial) toast('This recording plays the full verse that contains the dua.');
  el.play().catch(fail);
}
function fail() { toast('Could not load the recording. Check your connection and try again.'); current = null; queue = []; emit(); }
