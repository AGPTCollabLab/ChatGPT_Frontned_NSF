import React, { useState, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export const Message = ({ role, content, onAnnotate }) => {
  const { user } = useUser();
  const [focusedSentence, setFocusedSentence] = useState(null);
  const instructionsIdRef = useRef(
    `sentence-instructions-${Math.random().toString(36).slice(2)}`,
  );

  // Robust segmentation for assistant content with code block and list handling
  function segmentAssistantContent(text) {
    if (!text || typeof text !== 'string') return [];

    const segments = [];

    const parts = text.split(/(```[\s\S]*?```)/g);

    for (const part of parts) {
      if (!part) continue;

      if (/^```[\s\S]*?```$/.test(part)) {
        const code = part
          .replace(/^```[a-zA-Z0-9]*\n?/, '')
          .replace(/```$/, '');
        segments.push({ text: code, annotatable: false, type: 'code' });
        continue;
      }

      const lines = part.split(/\n+/);
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (/^([*\-•\u2022]|\d+\.|[a-zA-Z]\))\s+/.test(line)) {
          segments.push({ text: line, annotatable: true, type: 'list' });
          continue;
        }

        try {
          if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter('en', {
              granularity: 'sentence',
            });
            for (const { segment } of segmenter.segment(line)) {
              const sentence = segment.trim();
              if (sentence) {
                segments.push({
                  text: sentence,
                  annotatable: true,
                  type: 'sentence',
                });
              }
            }
            continue;
          }
        } catch (_) {
          // Fallback to regex below
        }

        const fallback = line
          .split(/(?<=[.!?])\s+(?=[A-Z0-9\"\(\[])|(?<=[.!?])$/)
          .map(s => s.trim())
          .filter(Boolean);
        for (const s of fallback) {
          segments.push({ text: s, annotatable: true, type: 'sentence' });
        }
      }
    }

    return segments;
  }

  const segments = role === 'assistant' ? segmentAssistantContent(content) : [];
  const annotatableSegments = segments.filter(s => s.annotatable);

  const handleSentenceKeyDown = (e, visibleIndex, absoluteIndex) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onAnnotate) {
        onAnnotate(annotatableSegments[visibleIndex].text, absoluteIndex);
      }
    }
  };

  const handleSentenceFocus = sentenceIndex => {
    setFocusedSentence(sentenceIndex);
  };

  if (role === 'assistant') {
    let visibleAnnotIdx = -1;

    return (
      <article
        className={`bg-gray-700 p-4 ${user?.picture ? 'ml-0' : ''}`}
        data-message-role="assistant"
        aria-label="ChatGPT response"
      >
        <div className="flex">
          <div
            className="w-[30px] flex flex-col justify-start items-center mr-4"
            aria-hidden="true"
          >
            {user?.picture && (
              <img
                src="/openai.svg"
                alt=""
                height={30}
                width={30}
                className="rounded-sm shadow-sm shadow-white/50 object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <div className="response-content">
              <span id={instructionsIdRef.current} className="sr-only">
                Press Enter or Space to annotate this sentence.
              </span>
              {segments.map((seg, absIndex) => {
                if (!seg.annotatable) {
                  return (
                    <span
                      key={`seg-${absIndex}`}
                      className="inline-block rounded px-1 whitespace-pre-wrap"
                      aria-label={
                        seg.type === 'code' ? 'Code block' : undefined
                      }
                    >
                      {seg.text}{' '}
                    </span>
                  );
                }

                visibleAnnotIdx += 1;
                const isFocused = focusedSentence === visibleAnnotIdx;
                const describedBy =
                  visibleAnnotIdx === 0 ? instructionsIdRef.current : undefined;

                return (
                  <button
                    key={`seg-${absIndex}`}
                    id={`sentence-${visibleAnnotIdx}`}
                    className={`sentence focus-visible:ring-2 focus-visible:ring-yellow-400 focus:bg-blue-600 focus:text-white rounded px-1 ${
                      isFocused ? 'bg-blue-500 text-white' : ''
                    }`}
                    type="button"
                    tabIndex={0}
                    onFocus={() => handleSentenceFocus(visibleAnnotIdx)}
                    onBlur={() => setFocusedSentence(null)}
                    onKeyDown={e =>
                      handleSentenceKeyDown(e, visibleAnnotIdx, absIndex)
                    }
                    onClick={() =>
                      onAnnotate &&
                      onAnnotate(
                        annotatableSegments[visibleAnnotIdx].text,
                        absIndex,
                      )
                    }
                    style={{ display: 'inline-block', margin: '2px' }}
                    aria-describedby={describedBy}
                  >
                    {seg.text}{' '}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`bg-gray-600 p-4 ${user?.picture ? 'ml-12' : ''}`}
      data-message-role="user"
      aria-label="Your message"
    >
      <div className="flex">
        <div
          className="w-[30px] flex flex-col justify-start items-center mr-4"
          aria-hidden="true"
        >
          {user?.picture && (
            <img
              src={user.picture}
              alt=""
              height={30}
              width={30}
              className="rounded-sm shadow-sm shadow-white/50 object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      </div>
    </article>
  );
};
