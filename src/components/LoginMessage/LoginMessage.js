import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const WELCOME_MESSAGE =
  'Welcome to the Accessible ChatGPT Interface. This is a ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Shift Tab to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const dialogRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the dialog wrapper so the screen reader recognises this as the
    // active modal. The wrapper is named via aria-labelledby (a short title)
    // so the dialog is identifiable, but the long welcome message itself
    // is delivered through a one-shot live region below. This way the
    // welcome text is NOT re-announced when the user tabs to a button.
    dialogRef.current?.focus();

    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'alert');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
    const writeTimer = setTimeout(() => {
      announcer.textContent = WELCOME_MESSAGE;
    }, 100);
    const cleanupTimer = setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 25000);

    return () => {
      clearTimeout(writeTimer);
      clearTimeout(cleanupTimer);
      if (document.body.contains(announcer)) {
        // Clear content first so any queued speech is cancelled before
        // the element is removed.
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
        <h2 id="welcome-title" className="text-xl font-bold mb-4">
          Welcome to ChatGPT Interface
        </h2>
        <p className="mb-4" aria-hidden="true">
          This is an accessible ChatGPT interface designed for screen reader
          users. Press Tab to focus the Acknowledge button and Enter or
          Space to continue. Press Shift Tab to focus the Reject button.
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
