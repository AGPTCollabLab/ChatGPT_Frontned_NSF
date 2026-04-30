import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const dialogRef = useRef(null);
  const acknowledgeButtonRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the dialog wrapper first. Screen readers will announce the
    // dialog content via aria-labelledby and aria-describedby.
    dialogRef.current?.focus();

    // After the welcome message has had time to be read aloud,
    // move focus to the Acknowledge button so the user can confirm.
    // Users can press Tab earlier to skip ahead.
    const moveFocusTimer = setTimeout(() => {
      acknowledgeButtonRef.current?.focus();
    }, 7000);

    return () => clearTimeout(moveFocusTimer);
  }, []);

  return (
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-dialog-title"
      aria-describedby="welcome-dialog-description"
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 outline-none"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <h2
          id="welcome-dialog-title"
          className="text-xl font-bold mb-4"
        >
          Welcome to ChatGPT Interface
        </h2>
        <p id="welcome-dialog-description" className="mb-4">
          This is an accessible ChatGPT interface designed for screen reader
          users. The Acknowledge button will be focused after this message is
          read. You can press Tab to focus it sooner, or Shift Tab to focus
          the Reject button.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            ref={acknowledgeButtonRef}
            onClick={onAcknowledge}
            className="btn"
            aria-label="Acknowledge the welcome message and continue to chat"
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
