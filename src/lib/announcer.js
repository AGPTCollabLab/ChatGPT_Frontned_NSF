// Persistent screen-reader announcers.
//
// Two live regions (one polite, one assertive) are created lazily on first
// use and kept in the DOM for the lifetime of the page. This avoids the
// timing and observer race conditions that come from creating a brand-new
// aria-live element for every announcement (which used to cause Firefox
// + Windows screen readers to silently drop the first response, and Chrome
// + VoiceOver on macOS to miss the feedback dialog announcement).

const POLITE_ID = '__sr_announcer_polite';
const ASSERTIVE_ID = '__sr_announcer_assertive';

function ensureRegion(id, role, ariaLive) {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.setAttribute('role', role);
    el.setAttribute('aria-live', ariaLive);
    el.setAttribute('aria-atomic', 'true');
    el.style.position = 'absolute';
    el.style.left = '-10000px';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.overflow = 'hidden';
    document.body.appendChild(el);
  }
  return el;
}

export function announce(message, politeness = 'polite') {
  if (typeof document === 'undefined' || !message) return;
  const region =
    politeness === 'assertive'
      ? ensureRegion(ASSERTIVE_ID, 'alert', 'assertive')
      : ensureRegion(POLITE_ID, 'status', 'polite');
  if (!region) return;
  // Clear first so the screen reader re-announces even when the same
  // message is sent twice in a row.
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}
