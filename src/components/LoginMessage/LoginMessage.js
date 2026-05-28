import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const WELCOME_TITLE = 'Welcome to ChatGPT Interface';
const WELCOME_INSTRUCTIONS =
  'This is an accessible ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Tab again to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const introRef = useRef(null);
  const acknowledgeRef = useRef(null);
  const rejectRef = useRef(null);
  const [actionsReady, setActionsReady] = useState(false);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the visible welcome text itself as one neutral start point.
    // Avoid live regions, aria-label, dialog roles, and hidden duplicate
    // text here: those caused either repeated speech or VoiceOver moving
    // through the buttons automatically.
    introRef.current?.focus();
  }, []);

  const revealActionsAndFocus = target => {
    setActionsReady(true);
    setTimeout(() => {
      const next = target === 'reject' ? rejectRef.current : acknowledgeRef.current;
      next?.focus();
    }, 0);
  };

  const handleIntroKeyDown = event => {
    if (event.key === 'Tab') {
      event.preventDefault();
      revealActionsAndFocus(event.shiftKey ? 'reject' : 'acknowledge');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <div
          ref={introRef}
          tabIndex="-1"
          className="outline-none"
          onKeyDown={handleIntroKeyDown}
        >
          <div className="text-xl font-bold mb-4">{WELCOME_TITLE}</div>
          <div className="mb-4">{WELCOME_INSTRUCTIONS}</div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            ref={acknowledgeRef}
            onClick={onAcknowledge}
            className="btn"
            tabIndex={actionsReady ? 0 : -1}
            aria-hidden={actionsReady ? undefined : 'true'}
          >
            Acknowledge
          </button>
          <button
            ref={rejectRef}
            onClick={handleReject}
            className="btn bg-red-500 hover:bg-red-600"
            tabIndex={actionsReady ? 0 : -1}
            aria-hidden={actionsReady ? undefined : 'true'}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginMessage;
