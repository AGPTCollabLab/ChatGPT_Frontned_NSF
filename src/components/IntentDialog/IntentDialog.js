import { useState, useEffect, useRef } from 'react';

const IntentDialog = ({ onSubmit, onClear }) => {
  const [intent, setIntent] = useState('');
  const titleRef = useRef(null);
  const textareaRef = useRef(null);

  const handleChange = e => {
    setIntent(e.target.value);
  };

  const handleClear = () => {
    setIntent('');
    onClear();
  };

  const handleSubmit = () => {
    // No minimum length requirement; intent is optional
    onSubmit(intent);
  };

  // Auto-focus and announce when dialog opens
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
    // Announce the dialog content
    const announcement = "Set chat intention dialog opened. This is optional. You can type your intention for this chat or skip.";
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    
    // Focus textarea after announcement
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 500);
    
    return () => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]"
      role="dialog"
      aria-labelledby="intent-dialog-title"
      aria-describedby="intent-dialog-description"
      aria-modal="true"
    >
      <div className="bg-gray-700 p-6 rounded shadow-md text-white">
        <h2 id="intent-dialog-title" className="text-xl font-bold mb-4" ref={titleRef} tabIndex="-1">
          Set chat intention
        </h2>
        <p id="intent-dialog-description" className="mb-4">
          Optionally describe your intention for this chat. You can skip this step.
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
