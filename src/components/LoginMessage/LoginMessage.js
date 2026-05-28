import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const WELCOME_TITLE = 'Welcome to ChatGPT Interface';
const WELCOME_INSTRUCTIONS =
  'This is an accessible ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Shift Tab to focus the Reject button.';
const WELCOME_ANNOUNCEMENT = `${WELCOME_TITLE}. ${WELCOME_INSTRUCTIONS}`;

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const introRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus one neutral, non-interactive node whose accessible name is the
    // whole welcome message. Do not use a separate live region here: the
    // live region was racing with heading focus and caused the screen reader
    // to jump between the heading and paragraph. This focus target reads the
    // full intro once; Tab then moves cleanly to Acknowledge.
    introRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <div
          ref={introRef}
          tabIndex="-1"
          role="group"
          aria-label={WELCOME_ANNOUNCEMENT}
          className="outline-none"
        >
          <h2 className="text-xl font-bold mb-4" aria-hidden="true">
            {WELCOME_TITLE}
          </h2>
          <p className="mb-4" aria-hidden="true">
            {WELCOME_INSTRUCTIONS}
          </p>
        </div>
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
