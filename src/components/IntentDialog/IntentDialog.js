import { useState, useEffect, useRef } from 'react';

const IntentDialog = ({ onSubmit, onClear }) => {
  const [intent, setIntent] = useState('');
  const dialogRef = useRef(null);

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
    // Focus the dialog wrapper so the screen reader announces the title
    // and description via aria-labelledby and aria-describedby.
    // Do not auto-move focus: the user presses Tab to reach the textarea
    // when they are ready, which prevents the screen reader from being
    // interrupted mid-sentence.
    dialogRef.current?.focus();
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
          Optionally describe your intention for this chat. This step is
          optional. Press Tab to focus the text area, or press Escape to
          skip and continue.
        </p>
        <textarea
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
