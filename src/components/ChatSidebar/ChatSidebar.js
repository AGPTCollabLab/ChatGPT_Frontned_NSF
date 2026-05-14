import { faMessage, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export const ChatSidebar = ({
  chatId,
  generatingResponse,
  isAnnouncingResponse,
}) => {
  const [chatList, setChatList] = useState([]);
  const router = useRouter();

  const handleNewChat = async e => {
    e.preventDefault();
    if (!generatingResponse) {
      await router.push(
        { pathname: '/chat', query: { showIntent: '1' } },
        undefined,
        { shallow: false },
      );
    }
  };

  // Defer fetching the chat list while a response is being generated or
  // announced. Re-fetching the list inserts a new <li> into the sidebar,
  // and that DOM change can interrupt the screen reader mid-response on
  // some browser + screen reader combinations.
  useEffect(() => {
    if (generatingResponse || isAnnouncingResponse) {
      return undefined;
    }

    let cancelled = false;
    const loadChatList = async () => {
      try {
        const response = await fetch('/api/chat/getChatList');
        const json = await response.json();
        if (!cancelled) {
          setChatList(json?.chats || []);
        }
      } catch (error) {
        console.error('Failed to load chat list:', error);
      }
    };

    // Small buffer so the polite "Response finished" announcement that
    // follows isAnnouncingResponse becoming false has a moment to finish.
    const timer = setTimeout(loadChatList, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chatId, generatingResponse, isAnnouncingResponse]);

  return (
    <nav
      className="flex flex-col h-full text-white bg-slate-900"
      aria-label="Chat navigation"
    >
      <div className="sticky top-0 bg-slate-900 z-10">
        <button
          id="new-chat-button"
          type="button"
          onClick={handleNewChat}
          className={`side-menu-item bg-emerald-500 hover:bg-emerald-600 w-full text-left ${
            generatingResponse ? 'pointer-events-none opacity-50' : ''
          }`}
          aria-disabled={generatingResponse}
          aria-label="Start new chat"
          tabIndex={generatingResponse ? -1 : 0}
          disabled={generatingResponse}
        >
          <FontAwesomeIcon
            icon={faPlus}
            aria-hidden="true"
            className="w-4 h-4"
          />
          <span>New chat</span>
        </button>
      </div>

      <section
        className="flex-1 overflow-auto"
        aria-labelledby="chat-history-heading"
      >
        <h2 id="chat-history-heading" className="sr-only">
          Chat history
        </h2>
        {chatList.length === 0 ? (
          <p className="sr-only" role="status">
            No previous chats. Start a new chat to begin.
          </p>
        ) : (
          <ul
            className="list-none p-0 m-0"
            aria-label={`${chatList.length} previous ${
              chatList.length === 1 ? 'chat' : 'chats'
            }`}
          >
            {chatList.map(chat => {
              const isCurrent = chatId === chat._id;
              return (
                <li key={chat._id}>
                  <Link
                    href={`/chat/${chat._id}`}
                    className={`side-menu-item ${
                      isCurrent ? 'bg-gray-700 hover:bg-gray-700' : ''
                    } ${
                      generatingResponse ? 'pointer-events-none opacity-50' : ''
                    }`}
                    aria-current={isCurrent ? 'page' : undefined}
                    aria-disabled={generatingResponse}
                    aria-label={
                      isCurrent
                        ? `Current chat: ${chat.title}`
                        : `Open chat: ${chat.title}`
                    }
                    tabIndex={generatingResponse ? -1 : 0}
                  >
                    <FontAwesomeIcon
                      icon={faMessage}
                      aria-hidden="true"
                      className="w-4 h-4"
                    />
                    <span>{chat.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="sticky bottom-0 bg-slate-900 z-10">
        <Link
          href="/api/auth/logout"
          className="side-menu-item bg-red-500 hover:bg-red-600"
          aria-label="Log out of the chat application"
          tabIndex={0}
        >
          <span>Logout</span>
        </Link>
      </div>
    </nav>
  );
};
