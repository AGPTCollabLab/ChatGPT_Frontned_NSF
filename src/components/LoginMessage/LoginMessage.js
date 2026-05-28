import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const WELCOME_TITLE = 'Welcome to ChatGPT Interface';
const WELCOME_INSTRUCTIONS =
  'This is an accessible ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Shift Tab to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const headingRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Anchor focus on the heading (a non-interactive element) so the
    // screen reader has a defined starting point. Without this, when the
    // dialog mounts focus has no anchor and the screen reader cursor
    // drifts through the focusable buttons and stops on the last one
    // (Reject) on its own. Focusing the heading keeps the start point
    // neutral and lets Tab go Acknowledge -> Reject as expected.
    headingRef.current?.focus();

    // Inject a polite live region that speaks the welcome message once.
    // We do NOT use role="dialog" / aria-modal / aria-label on the
    // wrapper, because those cause screen readers (notably VoiceOver) to
    // re-announce the dialog name, item count, and landmark transitions
    // whenever focus moves around. The user just wants "Acknowledge
    // button" to be announced cleanly when Tab lands there.
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);

    const writeTimer = setTimeout(() => {
      announcer.textContent = `${WELCOME_TITLE}. ${WELCOME_INSTRUCTIONS}`;
    }, 200);

    const cleanupTimer = setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 25000);

    return () => {
      clearTimeout(writeTimer);
      clearTimeout(cleanupTimer);
      if (document.body.contains(announcer)) {
        try {
          announcer.textContent = '';
        } catch (_) {}
        setTimeout(() => {
          if (document.body.contains(announcer)) {
            document.body.removeChild(announcer);
          }
        }, 100);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <h2
          ref={headingRef}
          tabIndex="-1"
          className="text-xl font-bold mb-4 outline-none"
        >
          {WELCOME_TITLE}
        </h2>
        <p className="mb-4">{WELCOME_INSTRUCTIONS}</p>
        <div className="flex justify-end space-x-4">
          <button onClick={onAcknowledge} className="btn">
            Acknowledge
          </button>
          <button
            onClick={handleReject}
            className="btn bg-red-500 hover:bg-red-600"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginMessage;
