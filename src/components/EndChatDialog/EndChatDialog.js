// EndChatDialog.js
import React, { useEffect, useState, useRef } from 'react';

const EndChatDialog = ({ chatId, messages, onSubmit, onClose }) => {
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatDidntGoWell, setWhatDidntGoWell] = useState('');
  const [loading, setLoading] = useState(true);
  const dialogRef = useRef(null);

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
      } catch (error) {
        console.error('Failed to generate summary:', error);
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

  // Focus the dialog wrapper so the screen reader announces the dialog
  // title and description via aria-labelledby and aria-describedby.
  // Do not auto-move focus so the screen reader is not interrupted.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-labelledby="feedback-dialog-title"
      aria-describedby="feedback-dialog-description"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 outline-none"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gray-800 p-8 rounded-md shadow-lg w-full max-w-md text-white"
        onClick={e => e.stopPropagation()}
      >
        <header>
          <h2
            id="feedback-dialog-title"
            className="text-xl font-bold mb-4"
          >
            Feedback
          </h2>
        </header>

        <div id="feedback-dialog-description" className="sr-only">
          Feedback dialog. Please describe what went well and what could be
          improved about your chat experience. Press Tab to focus the first
          answer field, or press Escape to cancel and continue chatting.
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
            <div className="mb-4">
              <label htmlFor="whatWentWell" className="block mb-2 font-medium">
                What went well?
              </label>
              <textarea
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
                aria-label="Submit feedback"
              >
                Submit Feedback
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
