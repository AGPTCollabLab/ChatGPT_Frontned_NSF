import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const WELCOME_INSTRUCTIONS =
  'This is an accessible ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Shift Tab to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const dialogRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the dialog wrapper. Screen readers will speak the short title
    // via aria-labelledby below. The longer instructions are delivered via
    // a one-shot live region so the screen reader doesn't repeat them
    // every time the user tabs.
    dialogRef.current?.focus();

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

    // Set the text after the element is in the DOM AND after enough delay
    // that screen readers have time to register the live region and the
    // dialog title announcement has settled. Setting too quickly causes
    // the message to be missed entirely.
    const writeTimer = setTimeout(() => {
      announcer.textContent = WELCOME_INSTRUCTIONS;
    }, 600);

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
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 outline-none"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        {/* h2 is aria-hidden so the screen reader does NOT also read it as
            a heading after using its text as the dialog's accessible name */}
        <h2
          id="welcome-title"
          className="text-xl font-bold mb-4"
          aria-hidden="true"
        >
          Welcome to ChatGPT Interface
        </h2>
        <p className="mb-4" aria-hidden="true">
          {WELCOME_INSTRUCTIONS}
        </p>
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
