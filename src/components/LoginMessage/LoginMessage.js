import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { announce } from '@/lib/announcer';

const WELCOME_TITLE = 'Welcome to ChatGPT Interface';
const WELCOME_INSTRUCTIONS =
  'This is an accessible ChatGPT interface designed for screen reader users. Press Tab to focus the Acknowledge button and Enter or Space to continue. Press Shift Tab to focus the Reject button.';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const dialogRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  useEffect(() => {
    // Focus the dialog wrapper. aria-label below names the dialog so the
    // screen reader announces it on focus. The longer instructions are
    // delivered through the persistent assertive live region.
    dialogRef.current?.focus();
    const refocusTimer = setTimeout(() => {
      if (
        dialogRef.current &&
        document.activeElement !== dialogRef.current
      ) {
        dialogRef.current.focus();
      }
    }, 60);

    const announceTimer = setTimeout(() => {
      announce(WELCOME_INSTRUCTIONS, 'assertive');
    }, 1000);

    return () => {
      clearTimeout(refocusTimer);
      clearTimeout(announceTimer);
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-label={WELCOME_TITLE}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 outline-none"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <div aria-hidden="true">
          <h2 className="text-xl font-bold mb-4">{WELCOME_TITLE}</h2>
          <p className="mb-4">{WELCOME_INSTRUCTIONS}</p>
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
