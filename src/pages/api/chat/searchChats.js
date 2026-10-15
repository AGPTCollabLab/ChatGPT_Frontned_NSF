import clientPromise from '@/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';
import { MAX_RESULTS, normalizeQuery, rankChats } from '@/lib/chatSearch';

export default async function handler(req, res) {
  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const query = normalizeQuery(req.query.q);
    if (!query) {
      return res.status(200).json({ results: [] });
    }

    const client = await clientPromise;
    const db = client.db('NsfDatabase');
    // Typo-tolerant matching cannot be expressed as a database filter, so
    // rank all of this user's chats here and keep the best matches.
    const chats = await db
      .collection('chats')
      .find(
        { userId: session.user.sub },
        { projection: { title: 1, 'messages.role': 1, 'messages.content': 1 } },
      )
      .toArray();

    res.status(200).json({ results: rankChats(chats, query, MAX_RESULTS) });
  } catch (e) {
    console.error('Error occurred in search chats: ', e);
    res.status(500).json({ message: 'An error occurred while searching chats' });
  }
}
