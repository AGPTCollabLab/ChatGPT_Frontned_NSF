import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const LoginMessage = ({ onAcknowledge }) => {
  const router = useRouter();
  const acknowledgeButtonRef = useRef(null);

  const handleReject = () => {
    router.push('/api/auth/logout');
  };

  // Auto-focus and announce the welcome message
  useEffect(() => {
    // Create an announcement for the welcome dialog
    const announcement = "Welcome to ChatGPT Interface! This is an accessible ChatGPT interface designed for screen reader users. Click Acknowledge to continue and start chatting.";
    
    // Use aria-live region to announce the message
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    
    // Focus the acknowledge button after a delay
    setTimeout(() => {
      if (acknowledgeButtonRef.current) {
        acknowledgeButtonRef.current.focus();
      }
    }, 1000);
    
    return () => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      aria-modal="true"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <h2 id="dialog-title" className="text-xl font-bold mb-4">
          Welcome to ChatGPT Interface!
        </h2>
        <p id="dialog-description" className="mb-4">
          This is an accessible ChatGPT interface designed for screen reader users. Click Acknowledge to continue and start chatting.
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
