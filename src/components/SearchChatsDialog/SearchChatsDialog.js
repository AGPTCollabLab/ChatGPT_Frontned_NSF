import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { getChatTitle } from '@/components/ChatTitle/ChatTitle';
import { describeResults, normalizeQuery } from '@/lib/chatSearch';

const SEARCH_DELAY_MS = 300;
const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export function SearchResults({ results, currentChatId, onSelect, onKeyDown }) {
  if (!results.length) return null;
  return (
    <ul className="list-none p-0 m-0 space-y-1" aria-label="Search results">
      {results.map((result, index) => {
        const isCurrent = result._id === currentChatId;
        return (
          <li key={result._id}>
            <Link
              href={`/chat/${result._id}`}
              data-search-result-index={index}
              className="side-menu-item m-0 block hover:bg-gray-700 focus:bg-gray-700"
              aria-current={isCurrent ? 'page' : undefined}
              aria-labelledby={`search-result-title-${index}`}
              aria-describedby={result.snippet ? `search-result-snippet-${index}` : undefined}
              onClick={onSelect}
              onKeyDown={event => onKeyDown(event, index)}
            >
              <span id={`search-result-title-${index}`} className="block font-semibold">
                {getChatTitle({ chatId: result._id, chatTitle: result.title })}
                {isCurrent && <span className="sr-only"> (current chat)</span>}
              </span>
              {result.snippet && (
                <span id={`search-result-snippet-${index}`} className="block text-sm text-gray-300">
                  {result.snippetRole === 'assistant' ? 'AGPT responded: ' : 'You said: '}
                  {result.snippet.parts.map((part, partIndex) =>
                    part.highlight ? (
                      <mark key={partIndex} className="bg-yellow-300 text-gray-900 rounded-sm">
                        {part.text}
                      </mark>
                    ) : (
                      part.text
                    ),
                  )}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function SearchChatsDialog({ currentChatId, onClose }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ query: '', results: [], error: false });
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search after the user pauses typing, and ignore responses for
  // queries that have since changed.
  useEffect(() => {
    const normalized = normalizeQuery(query);
    if (!normalized) {
      setLoading(false);
      setSearch({ query: '', results: [], error: false });
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/chat/searchChats?q=${encodeURIComponent(normalized)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const json = await response.json();
        setSearch({ query: normalized, results: json?.results || [], error: false });
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Failed to search chats:', error);
        setSearch({ query: normalized, results: [], error: true });
      }
      setLoading(false);
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const focusResult = index => {
    dialogRef.current
      ?.querySelector(`[data-search-result-index="${index}"]`)
      ?.focus();
  };

  const handleDialogKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose({ restoreFocus: true });
      return;
    }
    // Keep Tab and Shift+Tab inside the dialog while it is open.
    if (event.key === 'Tab') {
      const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const handleInputKeyDown = event => {
    if ((event.key === 'ArrowDown' || event.key === 'Enter') && search.results.length) {
      event.preventDefault();
      focusResult(0);
    }
  };

  const handleResultKeyDown = (event, index) => {
    if (event.key === 'ArrowDown' && index < search.results.length - 1) {
      event.preventDefault();
      focusResult(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else focusResult(index - 1);
    }
  };

  const statusMessage = search.error
    ? 'Search is unavailable right now. Please try again.'
    : describeResults(search.query, search.results);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-60 pt-[10vh]"
      onClick={event => {
        if (event.target === event.currentTarget) onClose({ restoreFocus: true });
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-chats-heading"
        className="bg-gray-800 text-white rounded-lg shadow-lg w-full max-w-2xl mx-4 flex flex-col max-h-[75vh]"
        onKeyDown={handleDialogKeyDown}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 id="search-chats-heading" className="text-xl font-bold">
            Search chats
          </h2>
          <button
            type="button"
            className="btn bg-transparent hover:bg-gray-700 px-3"
            onClick={() => onClose({ restoreFocus: true })}
            aria-label="Close search"
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        <form role="search" className="px-4" onSubmit={event => event.preventDefault()}>
          <label htmlFor="search-chats-input" className="sr-only">
            Search chats
          </label>
          <input
            ref={inputRef}
            id="search-chats-input"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search chat titles and messages"
            autoComplete="off"
            aria-describedby="search-chats-instructions"
            className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
          />
          <p id="search-chats-instructions" className="sr-only">
            Results update as you type. Press Down Arrow or Enter to move to the
            results, and Escape to close.
          </p>
        </form>

        <p role="status" className="px-4 py-2 text-sm text-gray-300">
          {loading ? '' : statusMessage}
        </p>

        <div className="overflow-y-auto px-2 pb-4" aria-busy={loading}>
          <SearchResults
            results={search.results}
            currentChatId={currentChatId}
            onSelect={() => onClose({ restoreFocus: false })}
            onKeyDown={handleResultKeyDown}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
