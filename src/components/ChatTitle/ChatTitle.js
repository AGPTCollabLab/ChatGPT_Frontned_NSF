import Head from 'next/head';

const MAX_TITLE_LENGTH = 60;

// Collapse whitespace and cut long titles at a word boundary so tab titles
// and the page heading stay short enough to announce.
function shortenTitle(text) {
  const title = text.replace(/\s+/g, ' ').trim();
  if (title.length <= MAX_TITLE_LENGTH) return title;
  const cut = title.slice(0, MAX_TITLE_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > MAX_TITLE_LENGTH / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function getChatTitle({ chatId, chatTitle, messages = [] }) {
  if (typeof chatTitle === 'string' && chatTitle.trim()) {
    return shortenTitle(chatTitle);
  }

  const firstUserMessage = messages.find(
    message =>
      message.role === 'user' &&
      typeof message.content === 'string' &&
      message.content.trim(),
  );

  return firstUserMessage
    ? shortenTitle(firstUserMessage.content)
    : chatId ? 'Chat conversation' : 'New chat';
}

export default function ChatTitle({ title }) {
  return (
    <Head>
      <title>{`${title} - Accessible ChatGPT`}</title>
    </Head>
  );
}
