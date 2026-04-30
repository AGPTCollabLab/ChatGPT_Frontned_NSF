import React, { useEffect, useState, useRef } from 'react';

const AnnotationDialog = ({
  chatId,
  messageIndex,
  selectedSentence,
  sentenceIndex,
  onSubmit,
  onClose,
}) => {
  const [goodOrBad, setGoodOrBad] = useState('');
  const [couldImprove, setCouldImprove] = useState('');
  const [shareResponse, setShareResponse] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    // Focus the dialog wrapper so the screen reader announces the dialog
    // title and description via aria-labelledby and aria-describedby.
    // Do not auto-move focus: the user presses Tab to reach the first
    // text area when they are ready, which prevents the screen reader
    // from being interrupted mid-sentence.
    dialogRef.current?.focus();
  }, []);

  const handleSubmit = e => {
    e.preventDefault();

    if (!goodOrBad.trim() || !couldImprove.trim() || !shareResponse.trim()) {
      alert('Please fill in all fields before submitting.');
      return;
    }

    if (
      shareResponse.toLowerCase() !== 'yes' &&
      shareResponse.toLowerCase() !== 'no'
    ) {
      alert('Please type "yes" or "no" for the sharing question.');
      return;
    }

    onSubmit({
      goodOrBad: goodOrBad.trim(),
      couldImprove: couldImprove.trim(),
      shareResponse: shareResponse.toLowerCase() === 'yes',
      selectedSentence,
      sentenceIndex,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={dialogRef}
        tabIndex="-1"
        className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto outline-none"
        role="dialog"
        aria-labelledby="annotation-dialog-title"
        aria-describedby="annotation-dialog-description"
        aria-modal="true"
      >
        <header>
          <h2
            id="annotation-dialog-title"
            className="text-xl font-bold mb-4 text-white"
          >
            Annotate Selected Sentence
          </h2>
        </header>

        <div id="annotation-dialog-description" className="sr-only">
          Dialog to provide annotation for a specific sentence from a ChatGPT
          response. The selected sentence is shown, followed by three
          required questions. Press Tab to focus the first answer field, or
          press Escape to cancel.
        </div>

        <div className="mb-4 p-4 bg-gray-700 rounded-md">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Selected Sentence:
          </h3>
          <p className="text-white italic">
            <q>{selectedSentence}</q>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="goodOrBad"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              1. What is good or bad about this response?
              <span className="text-red-400 ml-1" aria-label="required">
                *
              </span>
            </label>
            <textarea
              id="goodOrBad"
              value={goodOrBad}
              onChange={e => setGoodOrBad(e.target.value)}
              placeholder="Describe what you found good or bad about this specific sentence..."
              className="w-full h-24 p-2 mb-1 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="couldImprove"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              2. What could be improved?
              <span className="text-red-400 ml-1" aria-label="required">
                *
              </span>
            </label>
            <textarea
              id="couldImprove"
              value={couldImprove}
              onChange={e => setCouldImprove(e.target.value)}
              placeholder="Suggest how this sentence or response could be improved..."
              className="w-full h-24 p-2 mb-1 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="shareResponse"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              3. Do you want to share this annotation? (Type &quot;yes&quot;
              or &quot;no&quot;)
              <span className="text-red-400 ml-1" aria-label="required">
                *
              </span>
            </label>
            <input
              type="text"
              id="shareResponse"
              value={shareResponse}
              onChange={e => setShareResponse(e.target.value)}
              placeholder="Type 'yes' or 'no'"
              className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
              aria-describedby="share-help"
            />
            <div id="share-help" className="text-xs text-gray-400 mt-1">
              Type &quot;yes&quot; to allow sharing this annotation for
              research purposes, or &quot;no&quot; to keep it private.
            </div>
          </div>

          <div
            className="flex justify-end mt-4 gap-3"
            role="group"
            aria-label="Dialog actions"
          >
            <button
              type="submit"
              className="btn bg-emerald-500 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Submit annotation"
            >
              Submit Annotation
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn bg-blue-500 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Cancel annotation"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnotationDialog;
