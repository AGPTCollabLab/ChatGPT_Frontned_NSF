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
    // Focus the dialog wrapper so it owns the modal context.
    dialogRef.current?.focus();

    // Inject an assertive live region with the welcome message so the
    // screen reader reliably announces it first. We set textContent after
    // appending so aria-live triggers, and we keep the region in the DOM
    // long enough for the entire message to be spoken.
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
        document.body.removeChild(announcer);
      }
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-label={WELCOME_MESSAGE}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 outline-none"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <div aria-hidden="true">
          <h2 className="text-xl font-bold mb-4">
            Welcome to ChatGPT Interface
          </h2>
          <p className="mb-4">
            This is an accessible ChatGPT interface designed for screen reader
            users. Press Tab to focus the Acknowledge button and Enter or
            Space to continue. Press Shift Tab to focus the Reject button.
          </p>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onAcknowledge}
            className="btn"
            aria-label="Acknowledge and continue to chat"
          >
            Acknowledge
          </button>
          <button
            onClick={handleReject}
            className="btn bg-red-500 hover:bg-red-600"
            aria-label="Reject and log out"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginMessage;
