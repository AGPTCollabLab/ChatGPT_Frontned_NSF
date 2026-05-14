import Head from 'next/head';
import { ChatSidebar } from '@/components/ChatSidebar';
import { useEffect, useState, useCallback, useRef } from 'react';
import { streamReader } from 'openai-edge-stream';
import { v4 as uuid } from 'uuid';
import { Message } from '@/components/Message';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { getSession } from '@auth0/nextjs-auth0';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import LoginMessage from '@/components/LoginMessage';
import IntentDialog from '@/components/IntentDialog';
import AnnotationDialog from '@/components/AnnotationDialog';
import EndChatDialog from '@/components/EndChatDialog';

export default function Home({ chatId, messages = [], feedback, isEnded }) {
  // Persist the welcome dismissal in sessionStorage so the welcome page
  // does not come back if the chat page ever remounts during navigation.
  const [showLoginMessage, setshowLoginMessage] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return sessionStorage.getItem('welcomeAcknowledged') !== 'true';
    } catch (_) {
      return true;
    }
  });
  const [showInitialIntentDialog, setShowInitialIntentDialog] = useState(false);
  const [newChatId, setNewChatId] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState('');
  const [messageText, setMessageText] = useState('');
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [showSentenceAnnotationDialog, setShowSentenceAnnotationDialog] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [isDialogAutoPrompted, setIsDialogAutoPrompted] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(isEnded);
  const [intentCompleted, setIntentCompleted] = useState(false);
  const [isAnnouncingResponse, setIsAnnouncingResponse] = useState(false);
  const { user } = useUser();
  const [fullMessage, setFullMessage] = useState('');
  const [chatFeedback, setChatFeedback] = useState(feedback || []);
  const [hasAutoPromptedFeedback, setHasAutoPromptedFeedback] = useState(false);
  const [shouldShowFeedbackOnSpace, setShouldShowFeedbackOnSpace] = useState(false);
  const router = useRouter();
  
  // Refs for focus management
  const messageInputRef = useRef(null);
  // Last sentence button that was focused before opening the annotation dialog
  // so we can return focus to it when the dialog closes.
  const lastFocusedSentenceRef = useRef(null);

  // Create a one-off live region announcement and remove it afterward.
  // Important: the textContent must be set AFTER the element is in the DOM
  // so the screen reader reliably detects the aria-live change. Setting
  // content before append causes some screen readers (notably VoiceOver
  // and NVDA in some configurations) to miss the announcement entirely.
  const announceToScreenReader = (message, politeness = 'polite') => {
    if (typeof document === 'undefined' || !message) return;
    const announcer = document.createElement('div');
    const role = politeness === 'assertive' ? 'alert' : 'status';
    announcer.setAttribute('role', role);
    announcer.setAttribute('aria-live', politeness);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
    // Defer the textContent assignment so the live region is observed first.
    const writeTimer = setTimeout(() => {
      announcer.textContent = message;
    }, 80);
    const estimatedMs =
      politeness === 'assertive'
        ? Math.min(Math.max(5000, message.length * 40), 45000)
        : Math.max(2000, message.length * 50);
    setTimeout(() => {
      clearTimeout(writeTimer);
      if (document.body.contains(announcer)) {
        // Clear the content first so queued speech is cancelled, then
        // remove the element a moment later. This prevents the screen
        // reader from re-reading old announcements at unexpected times.
        try {
          announcer.textContent = '';
        } catch (_) {}
        setTimeout(() => {
          if (document.body.contains(announcer)) {
            document.body.removeChild(announcer);
          }
        }, 100);
      }
    }, estimatedMs + 200);
  };



  // Function to focus message input
  const focusMessageInput = (force = false) => {
    if (!force && isAnnouncingResponse) {
      return;
    }
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 100);
  };

  // Function to count user-assistant message exchanges
  const countExchanges = (messages) => {
    let exchanges = 0;
    let hasUserMessage = false;
    
    for (const message of messages) {
      if (message.role === 'user') {
        hasUserMessage = true;
      } else if (message.role === 'assistant' && hasUserMessage) {
        exchanges++;
        hasUserMessage = false;
      }
    }
    
    return exchanges;
  };

  const handleIntentSubmit = async intent => {
    const currentChatId = chatId || newChatId;
    const response = await fetch('/api/chat/saveIntent', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ chatId: currentChatId, intent }),
    });
    const data = await response.json();
    if (data.message === 'Intent saved successfully') {
      setShowIntentDialog(false);
      localStorage.removeItem('pendingIntent');
      announceToScreenReader('Intent saved successfully. You can now start chatting.', 'assertive');
      focusMessageInput();
    } else {
      alert('An error occurred while saving your intent. Please try again.');
    }
  };

  const handleAnnotationSubmit = async annotation => {
    const response = await fetch('/api/chat/saveAnnotation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ chatId, annotation }),
    });
    const data = await response.json();
    if (data.message === 'Annotation saved successfully') {
      setShowAnnotationDialog(false);
    } else {
      alert(
        'An error occurred while saving your annotation. Please try again.',
      );
    }
  };

  // Move focus back to the sentence button that opened the annotation dialog.
  // When advanceToNext is true (called after a successful submit), focus
  // moves to the NEXT sentence button instead, so users can keep pressing
  // Enter to annotate consecutive sentences without using Tab.
  const restoreFocusToLastSentence = (advanceToNext = false) => {
    setTimeout(() => {
      const el = lastFocusedSentenceRef.current;
      if (!el || !document.body.contains(el)) return;

      if (advanceToNext) {
        const all = Array.from(
          document.querySelectorAll('button.sentence'),
        );
        const idx = all.indexOf(el);
        if (idx >= 0 && idx < all.length - 1) {
          const next = all[idx + 1];
          try {
            next.focus();
            next.scrollIntoView({ block: 'center' });
            lastFocusedSentenceRef.current = next;
            return;
          } catch (_) {}
        }
      }

      try {
        el.focus();
        el.scrollIntoView({ block: 'center' });
      } catch (_) {}
    }, 100);
  };

  const handleSentenceAnnotationSubmit = async annotation => {
    try {
      const response = await fetch('/api/chat/saveSentenceAnnotation', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          messageIndex: currentAnnotation.messageIndex,
          annotation,
        }),
      });
      const data = await response.json();

      if (data.message === 'Sentence annotation saved successfully') {
        setShowSentenceAnnotationDialog(false);
        setCurrentAnnotation(null);
        announceToScreenReader(
          'Annotation saved. Focused on the next sentence. Press Enter to annotate it, or Tab to skip.',
          'polite',
        );
        restoreFocusToLastSentence(true);
      } else {
        alert(
          'An error occurred while saving your annotation. Please try again.',
        );
      }
    } catch (error) {
      alert(
        'An error occurred while saving your annotation. Please try again.',
      );
    }
  };

  const handleMessageAnnotate = (selectedSentence, sentenceIndex, messageIndex) => {
    // Remember which sentence button is being annotated so focus can return
    // to it after the dialog closes. This prevents users from getting "stuck"
    // re-annotating only the first sentence each time.
    if (
      document.activeElement &&
      document.activeElement.classList?.contains('sentence')
    ) {
      lastFocusedSentenceRef.current = document.activeElement;
    }
    setCurrentAnnotation({
      selectedSentence,
      sentenceIndex,
      messageIndex
    });
    setShowSentenceAnnotationDialog(true);
  };

  const handleFeedback = () => {
    // Announce explicitly so the screen reader reliably says the dialog is
    // opening even if the dialog wrapper focus alone is missed.
    announceToScreenReader(
      'Feedback form opened. Please describe what went well and what could be improved. Press Tab to focus the first answer field, or Escape to cancel.',
      'polite',
    );
    setIsDialogAutoPrompted(false);
    setShowEndChatDialog(true);
  };

  const handleFeedbackSubmit = async feedback => {
    try {
      const response = await fetch('/api/chat/saveFeedback', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ chatId, feedback }),
      });
      const data = await response.json();

      if (data.message === 'Feedback saved successfully') {
        setShowEndChatDialog(false);
        setIsDialogAutoPrompted(false);
        setChatFeedback(prev => [...(Array.isArray(prev) ? prev : []), feedback]);
        announceToScreenReader('Feedback saved successfully. You can start a new chat.', 'assertive');
        const active = document.activeElement;
        if (active && typeof active.blur === 'function') {
          try { active.blur(); } catch (_) {}
        }
        setTimeout(() => {
          const newChatBtn = document.getElementById('new-chat-button');
          if (newChatBtn) {
            newChatBtn.focus();
            try { newChatBtn.scrollIntoView({ block: 'center' }); } catch (_) {}
          }
        }, 50);
      } else {
        alert(
          'An error occurred while saving your feedback. Please try again.',
        );
      }
    } catch (error) {
      alert('An error occurred while saving your feedback. Please try again.');
    }
  };

  const handleAcknowledge = () => {
    setshowLoginMessage(false);
    try {
      sessionStorage.setItem('welcomeAcknowledged', 'true');
    } catch (_) {}
    setTimeout(() => {
      const newChatBtn = document.getElementById('new-chat-button');
      if (newChatBtn) {
        newChatBtn.focus();
      } else {
        focusMessageInput();
      }
    }, 150);
  };

  const handleInitialIntentSubmit = async (intent) => {
    localStorage.setItem('pendingIntent', intent || '');
    setShowInitialIntentDialog(false);
    setIntentCompleted(true);
    setTimeout(() => {
      const newChatBtn = document.getElementById('new-chat-button');
      if (newChatBtn) {
        newChatBtn.focus();
        announceToScreenReader('Intent saved. Press Enter to start a new chat.', 'polite');
      }
    }, 100);
  };

  useEffect(() => {
    setIsChatEnded(isEnded);
  }, [chatId, isEnded]);

  useEffect(() => {
    setHasAutoPromptedFeedback(false);
    setShouldShowFeedbackOnSpace(false);
  }, [chatId]);

  useEffect(() => {
    const shouldShowIntent = router?.query?.showIntent === '1';
    if (!chatId && shouldShowIntent) {
      setShowIntentDialog(true);
      localStorage.removeItem('pendingIntent');
    }
  }, [chatId, router?.query?.showIntent]);

  useEffect(() => {
    const allMessages = [...messages, ...newChatMessages];
    const exchanges = countExchanges(allMessages);
    const hasFeedbackAlready = Array.isArray(chatFeedback) && chatFeedback.length > 0;
    
    if (
      exchanges >= 5 &&
      !hasAutoPromptedFeedback &&
      !hasFeedbackAlready &&
      chatId &&
      !shouldShowFeedbackOnSpace
    ) {
      setShouldShowFeedbackOnSpace(true);
      announceToScreenReader(
        'You have exchanged five messages. To give feedback about this chat, press Tab until you reach the Feedback button and activate it.',
        'polite',
      );
    }
  }, [messages, newChatMessages, hasAutoPromptedFeedback, chatId, shouldShowFeedbackOnSpace, chatFeedback]);

  useEffect(() => {
    if (generatingResponse) {
      announceToScreenReader('Thinking...', 'polite');
    }
  }, [generatingResponse]);

  useEffect(() => {
    if (!generatingResponse && fullMessage) {
      setNewChatMessages(prev => [
        ...prev,
        {
          _id: uuid(),
          role: 'assistant',
          content: fullMessage,
        },
      ]);
      
      const announceFullResponse = () => {
        setIsAnnouncingResponse(true);
        // Only announce after completion
        announceToScreenReader(`ChatGPT response: ${fullMessage}`, 'assertive');
        setTimeout(() => {
          setIsAnnouncingResponse(false);
          announceToScreenReader(
            'Response finished. You could ype your next message now.',
            'polite',
          );
        }, 300);
      };
      
      setTimeout(announceFullResponse, 500);
      setFullMessage('');
    }
  }, [generatingResponse, fullMessage]);

  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId]);

  useEffect(() => {
    if (!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);

  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
    setChatFeedback(feedback || []);
  }, [chatId, feedback]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (messageText.trim() === '') return;
    // Prevent double-submit while a previous response is still being
    // generated or announced.
    if (generatingResponse || isAnnouncingResponse) return;

    setGeneratingResponse(true);
    const currentMessageText = messageText;
    setNewChatMessages(prev => [
      ...prev,
      {
        _id: uuid(),
        role: 'user',
        content: currentMessageText,
      },
    ]);
    setMessageText('');

    const response = await fetch('/api/chat/sendMessage', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ chatId, message: currentMessageText }),
    });
    const data = response.body;

    if (!data) {
      return;
    }

    const reader = data.getReader();
    let content = '';
    await streamReader(reader, async message => {
      if (message.event === 'newChatId') {
        setNewChatId(message.content);
        const pendingIntent = localStorage.getItem('pendingIntent');
        if (pendingIntent && pendingIntent.trim().length > 0) {
          await fetch('/api/chat/saveIntent', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({ chatId: message.content, intent: pendingIntent.trim() }),
          });
        }
        localStorage.removeItem('pendingIntent');
      } else {
        setIncomingMessage(s => `${s}${message.content}`);
        content += message.content;
        // Do not announce streaming content; wait until response completes
      }
    });
    setFullMessage(content);
    setIncomingMessage('');
    setGeneratingResponse(false);
  };

  const focusFirstSentenceOfLastAssistant = () => {
    try {
      const containers = Array.from(document.querySelectorAll('[data-message-role="assistant"]'));
      if (!containers.length) return;
      const last = containers[containers.length - 1];
      const firstSentenceButton = last.querySelector('button.sentence');
      if (firstSentenceButton) {
        firstSentenceButton.focus();
        try { firstSentenceButton.scrollIntoView({ block: 'center' }); } catch (_) {}
        announceToScreenReader(
          'Focused first sentence of the last response. Press Enter to annotate this sentence. Press Tab to move to the next sentence and Enter to annotate it.',
          'polite',
        );
      }
    } catch (_) {}
  };

  const handleKeyDown = useCallback(
    e => {
      const isApple = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform) || /Mac/.test(window.navigator.userAgent);

      if (e.key === 'Enter') {
        if (showInitialIntentDialog || showIntentDialog || showAnnotationDialog || showEndChatDialog) {
          e.preventDefault();
          const focusedElement = document.activeElement;
          if (focusedElement && focusedElement.tagName === 'BUTTON') {
            focusedElement.click();
            return;
          }
          return;
        }

        if (
          messageText.trim() !== '' &&
          (isApple ? !e.metaKey : !e.ctrlKey)
        ) {
          e.preventDefault();
          handleSubmit(e);
        } else if (isApple ? e.metaKey : e.ctrlKey) {
          setMessageText(prev => prev + '\n');
        }
      } else if (e.key === '0' || e.keyCode === 48) {
        if ( (isApple && e.metaKey && e.altKey) || (!isApple && e.ctrlKey && e.altKey)) {
          e.preventDefault();
          if (chatId) {
            setShowAnnotationDialog(true);
          }
        }
      } else if (e.key === ' ' || e.keyCode === 32) {
        // Auto-prompted feedback after enough exchanges: pressing space
        // opens the feedback dialog. Space no longer focuses the message
        // input because the input is auto-focused once a response finishes.
        if (
          shouldShowFeedbackOnSpace &&
          !showEndChatDialog &&
          !showInitialIntentDialog &&
          !showIntentDialog &&
          !showAnnotationDialog &&
          document.activeElement !== messageInputRef.current
        ) {
          e.preventDefault();
          setShouldShowFeedbackOnSpace(false);
          setHasAutoPromptedFeedback(true);
          setIsDialogAutoPrompted(true);
          setShowEndChatDialog(true);
          return;
        }
        // Otherwise let the space key do its normal browser action
        // (insert a space when typing in the message input, activate a
        // focused button, etc.). No custom handling needed.
      }
    },
    [
      chatId,
      handleSubmit,
      showInitialIntentDialog,
      showIntentDialog,
      showAnnotationDialog,
      showSentenceAnnotationDialog,
      showEndChatDialog,
      messageText,
      isAnnouncingResponse,
      shouldShowFeedbackOnSpace,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const allMessages = [...messages, ...newChatMessages];

  return (
    <>
      {/* Intent, Annotation, Sentence Annotation, and Feedback dialogs */}
      {showIntentDialog && (
        <IntentDialog
          onSubmit={(intent) => {
            localStorage.setItem('pendingIntent', intent || '');
            setShowIntentDialog(false);
            announceToScreenReader('Intent noted. Start chatting when you are ready.', 'polite');
            focusMessageInput();
          }}
          onClear={() => {
            localStorage.setItem('pendingIntent', 'no intention');
            setShowIntentDialog(false);
            announceToScreenReader('Skipped intention. Default intention set to no intention.', 'polite');
            focusMessageInput();
          }}
        />
      )}
      {showAnnotationDialog && (
        <AnnotationDialog
          onSubmit={handleAnnotationSubmit}
          onClose={() => setShowAnnotationDialog(false)}
        />
      )}
      {showSentenceAnnotationDialog && currentAnnotation && (
        <AnnotationDialog
          chatId={chatId}
          messageIndex={currentAnnotation.messageIndex}
          selectedSentence={currentAnnotation.selectedSentence}
          sentenceIndex={currentAnnotation.sentenceIndex}
          onSubmit={handleSentenceAnnotationSubmit}
          onClose={() => {
            setShowSentenceAnnotationDialog(false);
            setCurrentAnnotation(null);
            restoreFocusToLastSentence();
          }}
        />
      )}
      {showEndChatDialog && (
        <EndChatDialog
          chatId={chatId}
          messages={allMessages}
          onSubmit={handleFeedbackSubmit}
          onClose={() => {
            setShowEndChatDialog(false);
            setIsDialogAutoPrompted(false);
            const active = document.activeElement;
            if (active && typeof active.blur === 'function') {
              try { active.blur(); } catch (_) {}
            }
            setTimeout(() => {
              const newChatBtn = document.getElementById('new-chat-button');
              if (newChatBtn) {
                newChatBtn.focus();
                try { newChatBtn.scrollIntoView({ block: 'center' }); } catch (_) {}
              }
            }, 50);
          }}
          isAutoPrompted={isDialogAutoPrompted}
        />
      )}
      {showLoginMessage && <LoginMessage onAcknowledge={handleAcknowledge} />}

      <div className={`fixed inset-0 ${showLoginMessage ? 'hidden' : ''}`}>
        <Head>
          <title>
            {chatId ? 'Chat conversation - Accessible ChatGPT' : 'New chat - Accessible ChatGPT'}
          </title>
        </Head>

        <a href="#message-input" className="skip-link sr-only focus:not-sr-only">
          Skip to message input
        </a>

        <div className="h-screen grid grid-cols-[260px_1fr]">
          <div className="h-screen overflow-hidden">
            <ChatSidebar
              chatId={chatId}
              generatingResponse={generatingResponse}
            />
          </div>

          <div className="flex flex-col h-screen bg-gray-700">
            <main
              id="chat-main"
              className="flex-1 overflow-y-auto"
              aria-label="Chat conversation"
            >
              <div className="flex flex-col justify-end min-h-full">
                <div>
                  {allMessages
                    .filter(
                      message =>
                        message.role === 'user' || message.role === 'assistant',
                    )
                    .map((message, messageIndex) => (
                      <Message
                        key={message._id}
                        role={message.role}
                        content={message.content}
                        onAnnotate={
                          message.role === 'assistant'
                            ? (selectedSentence, sentenceIndex) =>
                                handleMessageAnnotate(selectedSentence, sentenceIndex, messageIndex)
                            : undefined
                        }
                      />
                    ))}
                  {!!incomingMessage && (
                    <Message role="assistant" content={incomingMessage} streaming />
                  )}
                </div>
              </div>
            </main>

            <section
              className="flex-shrink-0 bg-gray-800 p-8"
              aria-label="Message input area"
            >
              <form onSubmit={handleSubmit} aria-label="Send message form">
                <fieldset
                  className="flex gap-2"
                  disabled={
                    showInitialIntentDialog ||
                    showIntentDialog ||
                    showAnnotationDialog ||
                    showSentenceAnnotationDialog ||
                    showEndChatDialog ||
                    isChatEnded
                  }
                >
                  <legend className="sr-only">Compose a message</legend>
                  <textarea
                    id="message-input"
                    ref={messageInputRef}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder={
                      isChatEnded
                        ? 'Chat ended'
                        : generatingResponse
                        ? 'Waiting for response...'
                        : 'Send a message...'
                    }
                    className="w-full resize-none rounded-md bg-gray-700 px-5 py-1 text-white"
                    aria-label="Message text area. Type your message and press Enter to send."
                  ></textarea>
                  <button
                    className="btn"
                    type="submit"
                    aria-label="Send message"
                    aria-keyshortcuts="Enter"
                    disabled={
                      generatingResponse ||
                      isAnnouncingResponse ||
                      !messageText.trim()
                    }
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={focusFirstSentenceOfLastAssistant}
                    className="btn bg-purple-600 hover:bg-purple-700"
                    aria-label="Annotate last response"
                  >
                    Annotate
                  </button>
                  <button
                    type="button"
                    onClick={handleFeedback}
                    className="btn bg-blue-600 text-white hover:bg-blue-800"
                    aria-label="Give feedback about this chat"
                  >
                    Feedback
                  </button>
                </fieldset>
              </form>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async context => {
  const chatId = context.params?.chatID?.[0] || null;

  if (chatId) {
    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (err) {
      return {
        redirect: {
          destination: '/chat',
          permanent: false,
        },
      };
    }

    const { user } = await getSession(context.req, context.res);
    const client = await clientPromise;
    const db = client.db('NsfDatabase');
    const chat = await db
      .collection('chats')
      .findOne({ userId: user.sub, _id: objectId });

    if (!chat) {
      return {
        redirect: {
          destination: '/chat',
          permanent: false,
        },
      };
    }

    const serializedFeedback = chat.feedback && Array.isArray(chat.feedback)
      ? chat.feedback.map(fb => ({
          ...fb,
          submittedAt: fb.submittedAt ? fb.submittedAt.toISOString() : null,
        }))
      : [];

    return {
      props: {
        chatId,
        messages: chat.messages.map(message => ({
          ...message,
          _id: uuid(),
          messageTime: message.messageTime
            ? message.messageTime.toISOString()
            : null,
        })),
        feedback: serializedFeedback,
        isEnded: false,
      },
    };
  }

  return {
    props: {},
  };
};
