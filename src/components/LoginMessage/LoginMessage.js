import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const dialogRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the dialog wrapper so the screen reader enters the modal
    // context. With aria-labelledby + aria-describedby below, focusing
    // the wrapper causes the screen reader to read the short title AND
    // the full description once. aria-describedby content is not
    // re-announced when the user tabs to a button, so the welcome text
    // won't repeat.
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-description"
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 outline-none"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <h2 id="welcome-title" className="text-xl font-bold mb-4">
          Welcome to ChatGPT Interface
        </h2>
        <p id="welcome-description" className="mb-4">
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
