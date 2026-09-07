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
  const [errorMessage, setErrorMessage] = useState('');

  const dialogRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  useEffect(() => {
    // Save the element that had focus before the dialog opened.
    previouslyFocusedElement.current = document.activeElement;

    // Move focus to the dialog so a screen reader announces
    // the dialog title and description.
    dialogRef.current?.focus();

    // Restore focus when the dialog closes.
    return () => {
      previouslyFocusedElement.current?.focus();
    };
  }, []);

  const handleSubmit = e => {
    e.preventDefault();

    if (!goodOrBad.trim() || !couldImprove.trim() || !shareResponse) {
      setErrorMessage(
        'Please answer all three required questions before submitting.'
      );
      return;
    }

    setErrorMessage('');

    onSubmit({
      goodOrBad: goodOrBad.trim(),
      couldImprove: couldImprove.trim(),
      shareResponse: shareResponse === 'yes',
      selectedSentence,
      sentenceIndex,
    });
  };

  // Handle Escape and keep keyboard focus inside the modal.
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll(
        'textarea, input, button, select, [href], [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        ref={dialogRef}
        tabIndex="-1"
        className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="annotation-dialog-title"
        aria-describedby="annotation-dialog-description"
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
          response. The selected sentence is shown, followed by three required
          questions. Press Tab to move through the form. Press Escape to
          cancel.
        </div>

        <div className="mb-4 p-4 bg-gray-700 rounded-md"
          tabIndex="0"
          aria-labelledby="selected-sentence-heading"
        >
          <h3
            id="selected-sentence-heading"
            className="text-sm font-semibold text-gray-300 mb-2"
          >
            Selected Sentence:
          </h3>

          <p
            className="text-white italic">
            <q>{selectedSentence}</q>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {errorMessage && (
            <div
              id="annotation-error"
              role="alert"
              aria-live="assertive"
              className="mb-4 text-red-300"
            >
              {errorMessage}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="goodOrBad"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              1. What is good or bad about this response?
              <span className="text-red-400 ml-1" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> Required.</span>
            </label>

            <textarea
              id="goodOrBad"
              value={goodOrBad}
              onChange={e => setGoodOrBad(e.target.value)}
              placeholder="Describe what you found good or bad about this specific sentence..."
              className="w-full h-24 p-2 mb-1 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-describedby={
                errorMessage ? 'goodOrBad-help annotation-error' : 'goodOrBad-help'
              }
            />

            <div id="goodOrBad-help" className="sr-only">
              Describe what you found good or bad about the selected sentence.
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="couldImprove"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              2. What could be improved?
              <span className="text-red-400 ml-1" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> Required.</span>
            </label>

            <textarea
              id="couldImprove"
              value={couldImprove}
              onChange={e => setCouldImprove(e.target.value)}
              placeholder="Suggest how this sentence or response could be improved..."
              className="w-full h-24 p-2 mb-1 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-describedby={
                errorMessage
                  ? 'couldImprove-help annotation-error'
                  : 'couldImprove-help'
              }
            />

            <div id="couldImprove-help" className="sr-only">
              Suggest how the selected sentence or response could be improved.
            </div>
          </div>

          <fieldset
            className="mb-6"
            aria-describedby={
              errorMessage ? 'share-help annotation-error' : 'share-help'
            }
          >
            <legend className="block text-sm font-medium text-gray-300 mb-2">
              3. Do you want to share this annotation?
              <span className="text-red-400 ml-1" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> Required.</span>
            </legend>

            <div className="flex gap-6">
              <label
                htmlFor="shareResponseYes"
                className="flex items-center text-white"
              >
                <input
                  id="shareResponseYes"
                  type="radio"
                  name="shareResponse"
                  value="yes"
                  checked={shareResponse === 'yes'}
                  onChange={e => setShareResponse(e.target.value)}
                  required
                  tabIndex={shareResponse === '' || shareResponse === 'yes' ? 0 : -1}
                  className="mr-2"
                />
                Yes
              </label>

              <label
                htmlFor="shareResponseNo"
                className="flex items-center text-white"
              >
                <input
                  id="shareResponseNo"
                  type="radio"
                  name="shareResponse"
                  value="no"
                  checked={shareResponse === 'no'}
                  onChange={e => setShareResponse(e.target.value)}
                  tabIndex={shareResponse === 'no' ? 0 : -1}
                  className="mr-2"
                />
                No
              </label>
            </div>

            <div id="share-help" className="text-xs text-gray-400 mt-1">
              Select yes to allow sharing this annotation for research
              purposes, or no to keep it private.
            </div>
          </fieldset>

          <div
            className="flex justify-end mt-4 gap-3"
            role="group"
            aria-label="Dialog actions"
          >
            <button
              type="submit"
              className="btn bg-emerald-500 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Submit Annotation
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn bg-blue-500 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
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