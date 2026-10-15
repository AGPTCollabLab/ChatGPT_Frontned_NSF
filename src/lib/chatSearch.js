export const MAX_QUERY_LENGTH = 200;
export const MAX_RESULTS = 20;

const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER = 100;
const WORD = /[\p{L}\p{N}]+/gu;
const WORD_CHAR = /[\p{L}\p{N}]/u;

// Relevance tiers, best first. Within a tier, newer chats come first.
export const TIERS = {
  TITLE_PHRASE: 1,
  MESSAGE_PHRASE: 2,
  ALL_WORDS: 3,
  CLOSE_MATCH: 4,
};

export function normalizeQuery(query) {
  if (typeof query !== 'string') return '';
  return query.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH);
}

// Drop Markdown markers so text is searched and shown as plain text.
function toPlainText(text) {
  return text
    .replace(/```[a-zA-Z0-9]*/g, ' ')
    .replace(/(^|\n)\s*(#{1,6}|>|[-*+]|\d+[.)])\s+/g, '$1')
    .replace(/[*`]+/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lowercase and remove accents. For text with non-ASCII characters, record
// where each folded character came from so matches can be highlighted in
// the original text; plain ASCII text keeps the same positions (map null).
function fold(plain) {
  if (/^[\x00-\x7f]*$/.test(plain)) return { folded: plain.toLowerCase(), map: null };
  let folded = '';
  const map = [];
  for (let i = 0; i < plain.length; ) {
    const char = String.fromCodePoint(plain.codePointAt(i));
    const base = char.charCodeAt(0) < 128
      ? char.toLowerCase()
      : char.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    for (let k = 0; k < base.length; k += 1) map.push(i);
    folded += base;
    i += char.length;
  }
  map.push(plain.length);
  return { folded, map };
}

function prepareText(text) {
  const plain = toPlainText(text);
  return { plain, ...fold(plain) };
}

// Word positions, computed only for text whose snippet may be shown.
function wordsWithPositions(text) {
  return Array.from(text.folded.matchAll(WORD), match => ({
    word: match[0],
    start: match.index,
    end: match.index + match[0].length,
  }));
}

function prepareQuery(query) {
  const { folded } = fold(normalizeQuery(query));
  const words = Array.from(new Set(folded.match(WORD) || []));
  // Cache word comparisons for this search, since the same words repeat
  // across messages and chats.
  return { phrase: folded, words, matches: new Map(words.map(w => [w, new Map()])) };
}

// Words of 3 letters or fewer must match exactly; longer words may be off
// by one letter, and words of 8 or more letters by two.
export function allowedEdits(word) {
  if (word.length <= 3) return 0;
  return word.length <= 7 ? 1 : 2;
}

// Damerau-Levenshtein (optimal string alignment) distance, counting a swap
// of neighbouring letters as one edit. Stops early once the distance
// must exceed `max`.
export function isWithinEdits(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  let previousPrevious = null;
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, previousPrevious[j - 2] + 1);
      }
      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return false;
    previousPrevious = previous;
    previous = current;
  }
  return previous[b.length] <= max;
}

// How a text word matches a query word: 'exact', 'prefix', 'typo' or null.
function matchWord(queryWord, word) {
  if (word === queryWord) return 'exact';
  if (queryWord.length >= 3 && word.startsWith(queryWord)) return 'prefix';
  const max = allowedEdits(queryWord);
  if (max && word.length > 3 && isWithinEdits(queryWord, word, max)) return 'typo';
  return null;
}

function cachedMatch(query, queryWord, word) {
  const cache = query.matches.get(queryWord);
  if (!cache.has(word)) cache.set(word, matchWord(queryWord, word));
  return cache.get(word);
}

// The best match for a query word anywhere in a set of words.
function bestMatch(query, queryWord, wordSet) {
  if (wordSet.has(queryWord)) return 'exact';
  let best = null;
  for (const word of wordSet) {
    const kind = cachedMatch(query, queryWord, word);
    if (kind === 'prefix') return kind;
    if (kind) best = kind;
  }
  return best;
}

// Phrase occurrences that start at the beginning of a word.
function findPhrase(text, phrase) {
  const ranges = [];
  if (!phrase) return ranges;
  for (let index = text.folded.indexOf(phrase); index !== -1; index = text.folded.indexOf(phrase, index + 1)) {
    if (index === 0 || !WORD_CHAR.test(text.folded[index - 1])) {
      ranges.push({ start: index, end: index + phrase.length });
    }
  }
  return ranges;
}

function findWords(text, query) {
  const ranges = [];
  for (const { word, start, end } of wordsWithPositions(text)) {
    for (const queryWord of query.words) {
      const kind = cachedMatch(query, queryWord, word);
      if (kind) {
        ranges.push({ start, end: kind === 'prefix' ? start + queryWord.length : end, queryWord });
        break;
      }
    }
  }
  return ranges;
}

// Cut a window of plain text around the first highlight and split it into
// parts so the UI can mark each highlighted word.
export function buildSnippet(text, highlights = []) {
  const toPlain = index => (text.map ? text.map[index] : index);
  const ranges = highlights
    .map(({ start, end }) => ({ start: toPlain(start), end: toPlain(end) }))
    .sort((a, b) => a.start - b.start);
  const { plain } = text;
  const anchor = ranges[0] || { start: 0, end: 0 };

  let start = Math.max(0, anchor.start - SNIPPET_BEFORE);
  let end = Math.min(plain.length, anchor.end + SNIPPET_AFTER);
  // Avoid starting or ending in the middle of a word.
  if (start > 0) {
    const space = plain.indexOf(' ', start);
    if (space !== -1 && space < anchor.start) start = space + 1;
  }
  if (end < plain.length) {
    const space = plain.lastIndexOf(' ', end);
    if (space > anchor.end) end = space;
  }

  const parts = [];
  const push = (from, to, highlight) => {
    if (to > from) parts.push({ text: plain.slice(from, to), highlight });
  };
  let position = start;
  for (const range of ranges) {
    const from = Math.max(range.start, position);
    const to = Math.min(range.end, end);
    if (to <= from) continue;
    push(position, from, false);
    push(from, to, true);
    position = to;
  }
  push(position, end, false);

  if (!parts.length) return null;
  if (start > 0) parts.unshift({ text: '…', highlight: false });
  if (end < plain.length) parts.push({ text: '…', highlight: false });
  // Join neighbouring parts that are both highlighted or both plain.
  const merged = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (last && last.highlight === part.highlight) last.text += part.text;
    else merged.push(part);
  }
  return { parts: merged };
}

// The relevance tier of a chat, or null when it does not match.
function matchChat(chat, query) {
  const title = prepareText(typeof chat.title === 'string' ? chat.title : '');
  const messages = (chat.messages || [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, text: prepareText(m.content) }));

  const phraseInTitle = findPhrase(title, query.phrase).length > 0;
  const phraseMessage = messages.find(m => findPhrase(m.text, query.phrase).length);

  let tier = phraseInTitle ? TIERS.TITLE_PHRASE : phraseMessage ? TIERS.MESSAGE_PHRASE : null;
  if (!tier) {
    if (!query.words.length) return null;
    const allWords = new Set();
    for (const text of [title, ...messages.map(m => m.text)]) {
      for (const word of text.folded.match(WORD) || []) allWords.add(word);
    }
    const kinds = query.words.map(word => bestMatch(query, word, allWords));
    if (kinds.includes(null)) return null;
    tier = kinds.includes('typo') ? TIERS.CLOSE_MATCH : TIERS.ALL_WORDS;
  }

  return { _id: chat._id.toString(), title, messages, phraseMessage, tier };
}

// Show the message that best explains the match.
function toResult({ _id, title, messages, phraseMessage, tier }, query) {
  let snippetMessage;
  let highlights = [];
  if (phraseMessage) {
    snippetMessage = phraseMessage;
    highlights = findPhrase(phraseMessage.text, query.phrase);
  } else if (tier >= TIERS.ALL_WORDS) {
    let mostWords = 0;
    for (const message of messages) {
      const ranges = findWords(message.text, query);
      const count = new Set(ranges.map(r => r.queryWord)).size;
      if (count > mostWords) {
        mostWords = count;
        snippetMessage = message;
        highlights = ranges;
      }
    }
  }
  if (!snippetMessage) {
    snippetMessage = messages.find(m => m.role === 'user') || messages[0];
    highlights = [];
  }

  return {
    _id,
    title: title.plain || 'Untitled chat',
    tier,
    snippet: snippetMessage ? buildSnippet(snippetMessage.text, highlights) : null,
    snippetRole: snippetMessage ? snippetMessage.role : null,
  };
}

// Rank chats by relevance tier, then newest first (ObjectId order, as in
// the sidebar), and return the best `limit`. Chats that do not match every
// query word are left out. Snippets are built only for returned chats.
export function rankChats(chats, rawQuery, limit = MAX_RESULTS) {
  const query = prepareQuery(rawQuery);
  if (!query.phrase.trim()) return [];
  return chats
    .map(chat => matchChat(chat, query))
    .filter(Boolean)
    .sort((a, b) => a.tier - b.tier || (a._id < b._id ? 1 : a._id > b._id ? -1 : 0))
    .slice(0, limit)
    .map(match => toResult(match, query));
}

export function describeResults(query, results) {
  if (!query) return 'Type to search your chats.';
  if (!results.length) return `No chats found for "${query}".`;
  const closeMatches = results.some(r => r.tier === TIERS.CLOSE_MATCH)
    ? ', including close matches'
    : '';
  return `${results.length} ${results.length === 1 ? 'chat' : 'chats'} found for "${query}"${closeMatches}.`;
}
