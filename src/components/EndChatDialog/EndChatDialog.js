// EndChatDialog.js
import React, { useEffect, useState, useRef } from 'react';

const EndChatDialog = ({ chatId, messages, onSubmit, onClose }) => {
  const [summary, setSummary] = useState('');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatDidntGoWell, setWhatDidntGoWell] = useState('');
  const [loading, setLoading] = useState(true);
  const titleRef = useRef(null);
  const firstTextareaRef = useRef(null);

  useEffect(() => {
    const generateSummary = async () => {
      try {
        const response = await fetch('/api/chat/generateSummary', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ messages }),
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setSummary(data.summary);
      } catch (error) {
        console.error('Failed to generate summary:', error);
        setSummary('Failed to generate summary.');
      } finally {
        setLoading(false);
      }
    };
    generateSummary();
  }, [messages]);

  const handleSubmit = () => {
    onSubmit({
      whatWentWell,
      whatDidntGoWell,
    });
  };

  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Auto-focus and announce when dialog opens
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
    
    // Announce the dialog
    const announcement = "End Chat dialog opened. Please provide feedback about your chat experience.";
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    
    return () => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    };
  }, []);

  // Focus first textarea when loading is complete
  useEffect(() => {
    if (!loading && firstTextareaRef.current) {
      setTimeout(() => {
        firstTextareaRef.current.focus();
      }, 500);
    }
  }, [loading]);

  return (
    <div
      role="dialog"
      aria-labelledby="end-chat-dialog-title"
      aria-describedby="dialog-description"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gray-800 p-8 rounded-md shadow-lg w-full max-w-md text-white"
        onClick={e => e.stopPropagation()}
      >
        <header>
          <h2 id="end-chat-dialog-title" className="text-xl font-bold mb-4" ref={titleRef} tabIndex="-1">
            End Chat
          </h2>
        </header>

        <div id="dialog-description" className="sr-only">
          Dialog to provide feedback about the chat session. Contains a chat
          summary and two feedback sections.
        </div>

        {loading ? (
          <p role="status" aria-live="polite">
            Loading feedback form...
          </p>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Chat Summary</h3>
              <p className="mb-4" role="status" aria-live="polite">
                {summary}
              </p>
            </div> */}

            <div className="mb-4">
              <label htmlFor="whatWentWell" className="block mb-2 font-medium">
                What went well?
              </label>
              <textarea
                ref={firstTextareaRef}
                id="whatWentWell"
                value={whatWentWell}
                onChange={e => setWhatWentWell(e.target.value)}
                placeholder="Share your positive experiences..."
                className="w-full h-24 p-2 mb-1 border border-gray-600 rounded-md bg-gray-700 text-white"
                aria-required="true"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="whatDidntGoWell"
                className="block mb-2 font-medium"
              >
                What could be improved?
              </label>
              <textarea
                id="whatDidntGoWell"
                value={whatDidntGoWell}
                onChange={e => setWhatDidntGoWell(e.target.value)}
                placeholder="Share your suggestions for improvement..."
                className="w-full h-24 p-2 mb-1 border border-gray-600 rounded-md bg-gray-700 text-white"
                aria-required="true"
              />
            </div>

            <div
              className="flex justify-end mt-4 gap-3"
              role="group"
              aria-label="Dialog actions"
            >
              <button
                type="submit"
                className="btn bg-emerald-500 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                aria-label="Submit feedback and end chat"
              >
                Submit & End Chat
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn bg-blue-500 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                aria-label="Cancel and continue chat"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EndChatDialog;
