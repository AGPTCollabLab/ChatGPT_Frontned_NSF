import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const WELCOME_TITLE = 'Welcome to ChatGPT Interface';
const WELCOME_INSTRUCTIONS =
  'This is an accessible ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Tab again to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const introRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus one neutral, non-interactive node that contains the visible
    // welcome content. Do not add aria-label/live-region duplicates here:
    // screen readers were reading both the label and the visible text.
    // Focusing this block gives one start point; Tab then moves to
    // Acknowledge.
    introRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <div
          ref={introRef}
          tabIndex="-1"
          className="outline-none"
        >
          <h2 className="text-xl font-bold mb-4">
            {WELCOME_TITLE}
          </h2>
          <p className="mb-4">
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
