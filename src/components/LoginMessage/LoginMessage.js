import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const WELCOME_LABEL =
  'Welcome to the Accessible ChatGPT Interface. This is a ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Shift Tab to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const dialogRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the dialog wrapper so the screen reader announces the dialog
    // label once. Visible heading and paragraph are aria-hidden so they are
    // not announced separately when the user navigates.
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-label={WELCOME_LABEL}
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
