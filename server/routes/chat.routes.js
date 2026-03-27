const express = require('express');
const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all chats for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.findByParticipant(userId);
    
    // Enrich chats with participant info
    const enrichedChats = await Promise.all(chats.map(async (chat) => {
      const participants = await Promise.all(chat.participants.map(async (pId) => {
        const user = await User.findById(pId);
        if (user) {
          return {
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            profilePic: user.profilePic,
            publicKey: user.publicKey
          };
        }
        return null;
      }));
      
      return {
        ...chat,
        participants: participants.filter(p => p !== null)
      };
    }));
    
    res.json({ chats: enrichedChats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get received chat requests
router.get('/requests/received', async (req, res) => {
  try {
    const userId = req.user._id;
    // Find chats with status 'pending' where the current user is the recipient
    const chats = await new Promise((resolve, reject) => {
      Chat.db.find({ 
        status: 'pending',
        'requestInfo.recipientId': userId
      }, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
    
    const enrichedRequests = await Promise.all(chats.map(async (chat) => {
      const sender = await User.findById(chat.requestInfo.senderId);
      if (!sender) return null;
      
      return {
        _id: chat._id,
        sender: {
          _id: sender._id,
          username: sender.username,
          displayName: sender.displayName,
          profilePic: sender.profilePic
        },
        status: chat.status,
        createdAt: chat.createdAt
      };
    }));
    
    res.json({ requests: enrichedRequests.filter(r => r !== null) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sent chat requests
router.get('/requests/sent', async (req, res) => {
  try {
    const userId = req.user._id;
    // Find chats with status 'pending' where the current user is the sender
    const chats = await new Promise((resolve, reject) => {
      Chat.db.find({ 
        status: 'pending',
        'requestInfo.senderId': userId
      }, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
    
    const enrichedRequests = await Promise.all(chats.map(async (chat) => {
      const recipient = await User.findById(chat.requestInfo.recipientId);
      if (!recipient) return null;
      
      return {
        _id: chat._id,
        recipient: {
          _id: recipient._id,
          username: recipient.username,
          displayName: recipient.displayName,
          profilePic: recipient.profilePic
        },
        status: chat.status,
        createdAt: chat.createdAt
      };
    }));
    
    res.json({ requests: enrichedRequests.filter(r => r !== null) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a chat request
router.post('/request', async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;
    console.log('Sending chat request from:', senderId, 'to:', recipientId);
    
    if (senderId === recipientId) {
      return res.status(400).json({ message: 'You cannot send a request to yourself' });
    }
    
    // Check if a chat already exists between these users
    const existingChat = await new Promise((resolve, reject) => {
      // NeDB doesn't support $all, so we use $and with multiple conditions on the same array field
      Chat.db.findOne({ 
        $and: [
          { participants: senderId },
          { participants: recipientId }
        ]
      }, (err, doc) => {
        if (err) {
          console.error('Error finding existing chat:', err);
          return reject(err);
        }
        resolve(doc);
      });
    });
    
    if (existingChat) {
      console.log('Chat or request already exists between:', senderId, 'and:', recipientId);
      return res.status(400).json({ message: 'Chat or request already exists' });
    }
    
    console.log('Creating new pending chat...');
    const newChat = await Chat.create({
      participants: [senderId, recipientId],
      status: 'pending',
      requestInfo: {
        senderId,
        recipientId
      },
      messages: []
    });
    
    console.log('New chat created:', newChat._id);
    res.status(201).json({ message: 'Chat request sent', chat: newChat });
  } catch (error) {
    console.error('Error in /request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to a chat request
router.put('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // 'accepted', 'rejected', 'blocked'
    const userId = req.user._id;
    
    const chat = await Chat.findById(requestId);
    if (!chat) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    if (chat.requestInfo.recipientId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (status === 'accepted') {
      await Chat.update(requestId, { status: 'active' });
    } else if (status === 'rejected') {
      await Chat.delete(requestId);
    } else if (status === 'blocked') {
      await Chat.update(requestId, { status: 'blocked' });
      // Also add to user's blocked list
      const currentUser = await User.findById(userId);
      const blockedUsers = currentUser.blockedUsers || [];
      blockedUsers.push(chat.requestInfo.senderId);
      await User.update(userId, { blockedUsers });
    }
    
    res.json({ message: `Request ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin-only: Get all chats
router.get('/all', adminMiddleware, async (req, res) => {
  try {
    const chats = await new Promise((resolve, reject) => {
      Chat.db.find({}, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single chat with optional pagination — MUST be after /all to avoid matching 'all' as a chatId
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { skip = 0, limit = 20 } = req.query;
    const skipNum = parseInt(skip, 10) || 0;
    const limitNum = parseInt(limit, 10) || 20;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant (convert to strings and TRIM for comparison)
    const userIdStr = String(req.user?._id || req.user?.id || '').trim();
    const chatParticipants = (chat.participants || []).map(p => String(p).trim());
    const isParticipant = chatParticipants.includes(userIdStr);
    
    if (process.env.NODE_ENV !== 'production' || true) {
      console.log('--- ACCESS CHECK ---');
      console.log('Chat ID:', chatId);
      console.log('User ID:', userIdStr);
      console.log('Participants:', chatParticipants);
      console.log('Is participant:', isParticipant);
    }

    if (!isParticipant) {
      console.warn(`[Access Denied] User "${userIdStr}" is not a participant in chat ${chatId}`);
      return res.status(403).json({ message: 'Unauthorized access to this chat' });
    }
    
    // Enrich participants
    const participants = await Promise.all(chat.participants.map(async (pId) => {
      const user = await User.findById(pId);
      if (user) {
        return {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          profilePic: user.profilePic,
          publicKey: user.publicKey,
          lastSeen: user.lastSeen
        };
      }
      return null;
    }));
    
    // Apply pagination to messages if supported by database
    let messages = chat.messages || [];
    const totalMessages = messages.length;
    
    // For simple pagination, reverse the array (newest last), then slice
    if (messages.length > limitNum) {
      // Get the most recent messages (from end of array)
      messages = messages.slice(-limitNum);
    }
    
    res.json({ 
      chat: {
        ...chat,
        messages,
        participants: participants.filter(p => p !== null)
      },
      total: totalMessages,
      skip: skipNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message to a chat
router.post('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, encrypted, isVoiceMessage, autoDeleteIn, deleteAfterView } = req.body; // autoDeleteIn is in seconds
    const senderId = req.user._id;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Verify sender is a participant (convert to strings and TRIM for comparison)
    const senderIdStr = String(senderId || req.user?._id || req.user?.id || '').trim();
    const isParticipant = (chat.participants || []).some(pId => String(pId).trim() === senderIdStr);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    const message = {
      _id: uuidv4(),
      sender: senderId,
      content,
      encrypted: encrypted || false,
      isVoiceMessage: isVoiceMessage || false,
      isCallLog: req.body.isCallLog || false,
      autoDeleteAt: autoDeleteIn ? new Date(Date.now() + autoDeleteIn * 1000).toISOString() : null,
      deleteAfterView: deleteAfterView || false,
      createdAt: new Date().toISOString()
    };
    
    const updatedChat = await Chat.addMessage(chatId, message);
    
    res.status(201).json({ message: 'Message sent', chat: updatedChat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all messages in a chat as read
router.put('/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Verify user is a participant
    const userIdStr = String(userId || req.user?._id || req.user?.id);
    if (!chat.participants.some(pId => String(pId) === userIdStr)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Update messages that were sent by the other user and are not yet read
    const updatedMessages = chat.messages.map(msg => {
      if (String(msg.sender) !== String(userId) && !msg.readAt) {
        return { ...msg, readAt: new Date().toISOString() };
      }
      return msg;
    });
    
    await Chat.update(chatId, { messages: updatedMessages });
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cleanup "View Once" messages in a chat (called on exit)
router.post('/:chatId/cleanup', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const initialMessages = [...chat.messages];
    await Chat.cleanupViewOnceMessages(chatId, userId);
    const updatedChat = await Chat.findById(chatId);
    
    // Find which messages were deleted to notify other participants
    const deletedIds = initialMessages
      .filter(m => !updatedChat.messages.find(um => um._id === m._id))
      .map(m => m._id);

    if (deletedIds.length > 0) {
      const io = req.app.get('io');
      if (io) {
        // Broadcast to both users that messages have expired/been cleaned up
        io.to(chatId).emit('messages_expired', { chatId });
      }
    }

    res.json({ message: 'Cleanup completed', deletedCount: deletedIds.length });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark messages as delivered
router.put('/:chatId/delivered', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Mark all messages as delivered that were sent by THE OTHER USER and aren't delivered yet
    const now = new Date().toISOString();
    let updated = false;
    
    chat.messages = chat.messages.map(msg => {
      if (String(msg.sender) !== String(userId) && !msg.deliveredAt && !msg.readAt) {
        updated = true;
        return { ...msg, deliveredAt: now };
      }
      return msg;
    });
    
    if (updated) {
      await Chat.update(chatId, { messages: chat.messages });
    }
    
    res.json({ message: 'Messages marked as delivered' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message using receiverId (used by system/calling)
router.post('/message', async (req, res) => {
  try {
    const receiverId = String(req.body.receiverId);
    const content = req.body.content;
    const isCallLog = req.body.isCallLog;
    const encrypted = req.body.encrypted;
    const senderId = String(req.user._id);

    console.log('--- ATTEMPTING CALL LOG ---');
    console.log('Sender:', senderId);
    console.log('Receiver:', receiverId);

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    // Find if a chat already exists between these two users
    let chat = await Chat.findOneByParticipants(senderId, receiverId);

    // If no chat exists, create a new active one
    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        status: 'active',
        messages: []
      });
    }

    const message = {
      _id: uuidv4(),
      sender: senderId,
      content,
      isCallLog: isCallLog || false,
      encrypted: encrypted || false,
      createdAt: new Date().toISOString()
    };

    const updatedChat = await Chat.addMessage(chat._id, message);
    
    // Broadcast message via Socket.IO if possible (implementation depends on server.js/socket setup)
    // For now, we return 201 and the updated chat
    res.status(201).json({ message: 'Message sent', chat: updatedChat, newMessage: message });
  } catch (error) {
    console.error('Error in POST /api/chats/message:', {
      error: error.message,
      stack: error.stack,
      senderId: req.user?._id,
      receiverId: req.body.receiverId
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Delete a chat
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await Chat.delete(chatId);
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a specific message from a chat
router.delete('/:chatId/messages/:messageId', async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify user is a participant
    const currentUserIdStr = String(userId || req.user?._id || req.user?.id);
    const isParticipant = chat.participants.some(pId => String(pId) === currentUserIdStr);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await Chat.removeMessage(chatId, messageId);

    // Provide real-time feedback if global io is available (optional improvement)
    // or the client can handle it upon successful response

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug route to check current identity (ONLY FOR DIAGNOSTICS)
router.get('/debug/me', async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userStr = userId ? String(userId).trim() : 'MISSING';
    
    // Find all chats where this user is listed
    const allChats = await Chat.findAll();
    const myChats = allChats.filter(c => 
      (c.participants || []).some(p => String(p).trim() === userStr)
    );

    res.json({
      identifiedAs: userStr,
      userObject: req.user,
      myChatsCount: myChats.length,
      myChatIds: myChats.map(c => c._id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
