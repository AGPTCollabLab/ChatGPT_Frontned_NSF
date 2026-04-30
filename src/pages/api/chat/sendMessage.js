export const config = {
  runtime: 'edge',
};

const CHAT_MODEL = 'gpt-5-mini';

function sanitizeMessages(messages) {
  return (messages || [])
    .filter(
      m =>
        m &&
        typeof m.content === 'string' &&
        m.content.length > 0 &&
        (m.role === 'user' || m.role === 'assistant' || m.role === 'system'),
    )
    .map(m => ({ role: m.role, content: m.content }));
}

async function summarizeChatHistory(chatMessages) {
  if (!process.env.OPEN_API_KEY) {
    throw new Error('Missing OPEN_API_KEY');
  }

  const prompt = sanitizeMessages(chatMessages)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${process.env.OPEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that summarizes chat conversations.',
        },
        {
          role: 'user',
          content: `Summarize the following chat history:\n${prompt}`,
        },
      ],
      max_completion_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(
      `[sendMessage] OpenAI summary HTTP ${response.status}: ${text}`,
    );
    throw new Error(`OpenAI summary failed: ${response.status} ${text}`);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content?.trim();
}

export default async function handler(req) {
  try {
    console.log(`[sendMessage] OpenAI model: ${CHAT_MODEL}`);
    const { chatId: chatIdFromParam, message } = await req.json();
    let chatId = chatIdFromParam;
    const origin = req.headers.get('origin');

    let newChatId;
    let chatMessages = [];

    if (chatId) {
      const response = await fetch(`${origin}/api/chat/addMessageToChat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: req.headers.get('cookie'),
        },
        body: JSON.stringify({ chatId, role: 'user', content: message }),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(
          `[sendMessage] addMessageToChat HTTP ${response.status}: ${errText}`,
        );
        return new Response(
          JSON.stringify({ error: 'Failed to add message to chat' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
      const json = await response.json();
      chatMessages = json?.chat?.messages || [];
    } else {
      const response = await fetch(`${origin}/api/chat/createNewChat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: req.headers.get('cookie'),
        },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(
          `[sendMessage] createNewChat HTTP ${response.status}: ${errText}`,
        );
        return new Response(
          JSON.stringify({ error: 'Failed to create new chat' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
      const json = await response.json();
      chatId = json?._id;
      newChatId = json?._id;
      chatMessages = json?.messages || [];
    }

    // Summarize chat history if it gets too long
    const MAX_TOKENS = 4000;
    let messagesToInclude = [];
    let usedTokens = 0;
    let allMessages = [];

    chatMessages.reverse();
    for (let chatMessage of chatMessages) {
      allMessages.push(chatMessage);
      const messageTokens = chatMessage.content.length / 4;
      usedTokens = usedTokens + messageTokens;
      if (usedTokens > MAX_TOKENS) {
        const summary = await summarizeChatHistory(allMessages);
        messagesToInclude = [
          {
            role: 'system',
            content: `Summary of previous messages: ${summary}`,
          },
        ];
        usedTokens = summary.length / 4;
        allMessages = [];
      }
      messagesToInclude.push(chatMessage);
    }

    messagesToInclude.reverse();
    const sanitizedMessages = sanitizeMessages(messagesToInclude);

    const upstream = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${process.env.OPEN_API_KEY}`,
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: sanitizedMessages,
          stream: true,
        }),
      },
    );

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '');
      console.error(
        `[sendMessage] OpenAI streaming HTTP ${upstream.status}: ${errText}`,
      );
      return new Response(
        JSON.stringify({
          error: 'OpenAI request failed',
          status: upstream.status,
          details: errText,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (text, eventId) => {
          const payload = eventId
            ? `{"e": "${eventId}", "c": "${encodeURI(text)}"}\n`
            : `{"c": "${encodeURI(text)}"}\n`;
          controller.enqueue(encoder.encode(payload));
        };

        if (newChatId) {
          emit(newChatId, 'newChatId');
        }

        const reader = upstream.body.getReader();
        let buffer = '';
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const data = trimmed.slice(5).trim();
              if (!data || data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed?.choices?.[0]?.delta?.content;
                if (typeof content === 'string' && content.length > 0) {
                  fullContent += content;
                  emit(content);
                }
              } catch (err) {
                console.error(
                  `[sendMessage] SSE parse error: ${err?.message}`,
                );
              }
            }
          }
        } catch (err) {
          console.error('[sendMessage] Stream read error:', err);
        }

        try {
          const addMessageUrl = `${origin}/api/chat/addMessageToChat`;
          const addMessageResponse = await fetch(addMessageUrl, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              cookie: req.headers.get('cookie'),
            },
            body: JSON.stringify({
              chatId,
              role: 'assistant',
              content: fullContent,
            }),
          });
          if (!addMessageResponse.ok) {
            console.error(
              `[sendMessage] Failed to save assistant message: ${addMessageResponse.status} ${addMessageResponse.statusText}`,
            );
          }
        } catch (err) {
          console.error('[sendMessage] Save assistant message error:', err);
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    console.error('An error occurred in sendMessage API: ', e);
    return new Response(
      JSON.stringify({ error: 'Failed to send message' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
