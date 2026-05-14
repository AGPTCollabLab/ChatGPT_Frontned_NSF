import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const WELCOME_TITLE = 'Welcome to ChatGPT Interface';
const WELCOME_INSTRUCTIONS =
  'This is an accessible ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Shift Tab to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const dialogRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the dialog wrapper. aria-label below provides the dialog's
    // accessible name as a literal string (more reliable across screen
    // readers than aria-labelledby pointing into the DOM, especially when
    // the visible heading needs to be hidden to prevent double-reading).
    dialogRef.current?.focus();

    // Inject a polite live region with the longer instructions so the
    // screen reader announces them once after the title. Setting
    // textContent after the element is in the DOM AND after a delay is
    // required for the live region to actually fire on most screen
    // readers. The delay also lets the dialog title announcement finish
    // first so the instructions don't step on it.
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
      announcer.textContent = WELCOME_INSTRUCTIONS;
    }, 800);

    const cleanupTimer = setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 30000);

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
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-label={WELCOME_TITLE}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 outline-none"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        {/* All visible content is aria-hidden so it doesn't duplicate
            what aria-label and the live region already speak. */}
        <div aria-hidden="true">
          <h2 className="text-xl font-bold mb-4">{WELCOME_TITLE}</h2>
          <p className="mb-4">{WELCOME_INSTRUCTIONS}</p>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onAcknowledge}
            className="btn"
            aria-label="Acknowledge"
          >
            Acknowledge
          </button>
          <button
            onClick={handleReject}
            className="btn bg-red-500 hover:bg-red-600"
            aria-label="Reject"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginMessage;
