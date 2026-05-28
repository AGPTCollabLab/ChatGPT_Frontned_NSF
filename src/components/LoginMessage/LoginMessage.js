import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const WELCOME_TITLE = 'Welcome to ChatGPT Interface';
const WELCOME_INSTRUCTIONS =
  'This is an accessible ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Shift Tab to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const headingRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the heading on mount. The heading's aria-label contains the
    // full welcome message (title + instructions), so the screen reader
    // reads everything once when focus lands here. We do NOT use a live
    // region or role="dialog": the live region duplicated the title and
    // caused the screen reader to jump between the heading and the
    // announcement.
    headingRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <h2
          ref={headingRef}
          tabIndex="-1"
          aria-label={`${WELCOME_TITLE}. ${WELCOME_INSTRUCTIONS}`}
          className="text-xl font-bold mb-4 outline-none"
        >
          {WELCOME_TITLE}
        </h2>
        {/* Visible instructions for sighted users; hidden from the screen
            reader because the heading's aria-label already speaks them. */}
        <p className="mb-4" aria-hidden="true">
          {WELCOME_INSTRUCTIONS}
        </p>
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
