import clientPromise from '@/lib/mongodb';
import { getSession } from '@auth0/nextjs-auth0';
const { ObjectId } = require('mongodb');

export default async function handler(req, res) {
  try {
    const session = await getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { user } = session;
    const client = await clientPromise;
    const db = client.db('NsfDatabase');

    const { chatId, role, content } = req.body;

    console.log(
      `Received chatId: ${chatId}, role: ${role}, content: ${content}`,
    );

    const chat = await db.collection('chats').findOneAndUpdate(
      {
        _id: new ObjectId(chatId),
        userId: user.sub,
      },
      {
        $push: {
          messages: {
            role,
            content,
          },
        },
      },
      {
        returnDocument: 'after',
      },
    );

    if (!chat.value) {
      console.log('Chat not found or user not authorized');
      return res
        .status(404)
        .json({ message: 'Chat not found or user not authorized' });
    }

    res.status(200).json({
      chat: {
        ...chat.value,
        _id: chat.value._id.toString(),
      },
    });
  } catch (e) {
    console.error('An error occurred:', e);
    res
      .status(500)
      .json({ message: 'An error occurred when adding a message to a chat' });
  }
}
