// pages/api/chat/saveSentenceAnnotation.js
import { getSession } from '@auth0/nextjs-auth0';
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
    const { user } = await getSession(req, res);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { chatId, messageIndex, annotation } = req.body;

    // Input validation
    if (!chatId || typeof messageIndex !== 'number' || !annotation) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['chatId', 'messageIndex', 'annotation'],
      });
    }

    const { goodOrBad, couldImprove, shareResponse, selectedSentence, sentenceIndex } = annotation;

    if (
      typeof goodOrBad !== 'string' ||
      typeof couldImprove !== 'string' ||
      typeof shareResponse !== 'boolean' ||
      typeof selectedSentence !== 'string' ||
      typeof sentenceIndex !== 'number'
    ) {
      return res.status(400).json({
        message: 'Invalid annotation format',
        expected: {
          goodOrBad: 'string',
          couldImprove: 'string',
          shareResponse: 'boolean',
          selectedSentence: 'string',
          sentenceIndex: 'number'
        },
      });
    }

    const client = await clientPromise;
    const db = client.db('NsfDatabase');

    // Verify the chat and message exist and belong to the user
    const chat = await db.collection('chats').findOne({
      _id: new ObjectId(chatId),
      userId: user.sub
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // Find the specific message by array index
    if (messageIndex < 0 || messageIndex >= chat.messages.length) {
      return res.status(404).json({ message: 'Message index out of range' });
    }
    
    const message = chat.messages[messageIndex];
    if (!message) {
      return res.status(404).json({ message: 'Message not found in chat' });
    }

    if (message.role !== 'assistant') {
      return res.status(400).json({ message: 'Can only annotate assistant messages' });
    }

    // Create the annotation document
    const annotationDoc = {
      _id: new ObjectId(),
      chatId: new ObjectId(chatId),
      messageIndex: messageIndex,
      userId: user.sub,
      sentenceIndex: sentenceIndex,
      selectedSentence: selectedSentence.trim(),
      goodOrBad: goodOrBad.trim(),
      couldImprove: couldImprove.trim(),
      shareResponse: shareResponse,
      createdAt: new Date(),
      metadata: {
        messageRole: message.role,
        sentenceLength: selectedSentence.length,
        wordCount: selectedSentence.split(' ').length
      }
    };

    // Insert the annotation
    const result = await db.collection('sentenceAnnotations').insertOne(annotationDoc);

    if (!result.insertedId) {
      return res.status(500).json({ message: 'Failed to save annotation' });
    }

    // Optionally update the message to track annotation count
    // Since messages don't have _id fields, we'll use a different approach
    const updatePath = `messages.${messageIndex}.annotationCount`;
    const hasAnnotationsPath = `messages.${messageIndex}.hasAnnotations`;
    
    await db.collection('chats').updateOne(
      { _id: new ObjectId(chatId) },
      { 
        $inc: { [updatePath]: 1 },
        $set: { [hasAnnotationsPath]: true }
      }
    );

    return res.status(200).json({
      message: 'Sentence annotation saved successfully',
      annotationId: result.insertedId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error saving sentence annotation:', error);
    return res.status(500).json({
      message: 'Internal server error while saving annotation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
} 