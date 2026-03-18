import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY ?? process.env.OPEN_API_KEY;

if (!openaiApiKey) {
  throw new Error('Missing OpenAI API key');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export const config = {
  runtime: 'edge',
};

async function summarizeChatHistory(chatMessages) {
  const prompt = chatMessages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
  const completion = await openai.chat.completions.create({
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
    model: 'gpt-5-mini',
    max_tokens: 200,
  });
  return (
    completion.choices[0]?.message?.content.trim() ||
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
