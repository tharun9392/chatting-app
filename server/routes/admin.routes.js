const express = require('express');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await new Promise((resolve, reject) => {
      User.db.count({}, (err, count) => err ? reject(err) : resolve(count));
    });
    
    const chatCount = await new Promise((resolve, reject) => {
      Chat.db.count({}, (err, count) => err ? reject(err) : resolve(count));
    });
    
    // Total messages across all chats
    const allChats = await Chat.findAll();
    const messageCount = allChats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0);
    
    res.json({
      stats: {
        users: userCount,
        chats: chatCount,
        messages: messageCount,
        upTime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user
    await new Promise((resolve, reject) => {
      User.db.remove({ _id: userId }, {}, (err) => err ? reject(err) : resolve());
    });
    
    // Also delete chats where this user was a participant? 
    // Or just mark them as 'deleted user'? 
    // For now, let's keep it simple.
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
