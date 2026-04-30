import { useState, useEffect, useRef } from 'react';

const IntentDialog = ({ onSubmit, onClear }) => {
  const [intent, setIntent] = useState('');
  const dialogRef = useRef(null);
  const textareaRef = useRef(null);

  const handleChange = e => {
    setIntent(e.target.value);
  };

  const handleClear = () => {
    setIntent('');
    onClear();
  };

  const handleSubmit = () => {
    onSubmit(intent);
  };

  useEffect(() => {
    // Focus the dialog so screen readers announce the dialog title and
    // description via aria-labelledby and aria-describedby. Then move
    // focus to the textarea so the user can start typing.
    dialogRef.current?.focus();
    const focusTextareaTimer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 3500);
    return () => clearTimeout(focusTextareaTimer);
  }, []);

  // Allow Escape to skip
  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape') {
        handleClear();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div
      ref={dialogRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intent-dialog-title"
      aria-describedby="intent-dialog-description"
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] outline-none"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <h2
          id="intent-dialog-title"
          className="text-xl font-bold mb-4"
        >
          Set chat intention
        </h2>
        <p id="intent-dialog-description" className="mb-4">
          Optionally describe your intention for this chat. You can skip
          this step. Press Tab to focus the text area and start typing, or
          press Escape to skip.
        </p>
        <textarea
          ref={textareaRef}
          value={intent}
          onChange={handleChange}
          placeholder="Type your intention (optional)..."
          className="w-full h-24 p-2 mb-4 bg-gray-600 rounded"
          aria-label="Intentions text area"
          aria-describedby="intent-dialog-description"
        ></textarea>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSubmit}
            className="btn bg-blue-500 hover:bg-blue-600"
            aria-label="Save intention and continue"
          >
            Save
          </button>
          <button
            onClick={handleClear}
            className="btn"
            aria-label="Skip intention and continue"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntentDialog;
