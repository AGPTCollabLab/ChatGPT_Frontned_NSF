// pages/api/chat/saveFeedback.js
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      message: 'Method not allowed',
      allowedMethods: ['POST'],
    });
  }

  try {
    const { chatId, feedback } = req.body;

    // Input validation
    if (!chatId || !feedback) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['chatId', 'feedback'],
      });
    }

    const { whatWentWell, whatDidntGoWell } = feedback;

    if (
      typeof whatWentWell !== 'string' ||
      typeof whatDidntGoWell !== 'string'
    ) {
      return res.status(400).json({
        message: 'Invalid feedback format',
        expected: {
          whatWentWell: 'string',
          whatDidntGoWell: 'string',
        },
      });
    }

    const client = await clientPromise;
    const db = client.db('NsfDatabase');

    // Check if chat exists
    const existingChat = await db.collection('chats').findOne(
      { _id: new ObjectId(chatId) }
    );

    if (!existingChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Push new feedback to feedback array
    const result = await db.collection('chats').updateOne(
      { _id: new ObjectId(chatId) },
      {
        $push: {
          feedback: {
            whatWentWell: whatWentWell.trim(),
            whatDidntGoWell: whatDidntGoWell.trim(),
            submittedAt: new Date(),
          },
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Feedback not updated' });
    }

    return res.status(200).json({
      message: 'Feedback saved successfully',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return res.status(500).json({
      message: 'Internal server error while saving feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
