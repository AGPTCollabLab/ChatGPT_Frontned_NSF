const SUMMARY_MODEL = 'gpt-5-mini';

export const config = {
  runtime: 'edge',
};

async function summarizeChatHistory(chatMessages) {
  if (!process.env.OPEN_API_KEY) {
    throw new Error('Missing OPEN_API_KEY');
  }

  const prompt = chatMessages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${process.env.OPEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: SUMMARY_MODEL,
      messages: [
        {
          role: 'system',
          content: `
        Chat history:
${prompt}
        Based on the following chat history, provide a summary of the conversation in 100 words or less. Make it sound like a human explaining the interaction and dont use the word user, say "you" instead of user and say "chatgpt" instead of assistant.:

`,
        },
      ],
      max_completion_tokens: 200,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI summary failed: ${response.status} ${text}`);
  }

  const json = await response.json();
  return (
    json?.choices?.[0]?.message?.content?.trim() ||
    'Summary could not be generated.'
  );
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`[generateSummary] OpenAI model: ${SUMMARY_MODEL}`);
    const { messages } = await req.json();
    const summary = await summarizeChatHistory(messages);
    return new Response(JSON.stringify({ summary }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('An error occurred in generateSummary API: ', e);
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
