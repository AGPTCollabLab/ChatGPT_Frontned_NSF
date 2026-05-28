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
    // accessible name as a literal string. Re-focus after a short tick
    // in case the browser tried to move focus to the first focusable
    // child (Acknowledge button) right after mount.
    dialogRef.current?.focus();
    const refocusTimer = setTimeout(() => {
      if (
        dialogRef.current &&
        document.activeElement !== dialogRef.current
      ) {
        dialogRef.current.focus();
      }
    }, 60);

    // Inject a polite live region with the instructions. Polite (instead
    // of assertive) yields to focus changes, so when the user Tabs to
    // the Acknowledge button, the screen reader stops reading the
    // instructions and immediately announces the focused button. With
    // assertive, the screen reader holds the voice channel and the
    // button focus is silently ignored.
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
    }, 1200);

    const cleanupTimer = setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 30000);

    return () => {
      clearTimeout(refocusTimer);
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
