const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a new NeDB datastore for chats
const db = new Datastore({
  filename: path.join(dataDir, 'chats.db'),
  autoload: true
});

// Create indexes
db.ensureIndex({ fieldName: 'participants' }, (err) => {
  if (err) console.error('Error creating index:', err);
});

// Chat model functions
const Chat = {
  // Expose the database for direct operations
  db,
  
  // Create a new chat
  create(chatData) {
    const chat = {
      ...chatData,
      messages: chatData.messages || [],
      encryptionKeys: chatData.encryptionKeys || {},
      lastActivity: chatData.lastActivity || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return new Promise((resolve, reject) => {
      db.insert(chat, (err, newDoc) => {
        if (err) return reject(err);
        resolve(newDoc);
      });
    });
  },
  
  // Find a chat by ID
  findById(id) {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  },
  
  // Find a specific chat between two users
  findOneByParticipants(userId1, userId2) {
    return new Promise((resolve, reject) => {
      // Find a chat where both users are in the participants array
      // Using $and with two participant matches is very reliable in NeDB
      db.findOne({ $and: [{ participants: userId1 }, { participants: userId2 }] }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  },
  
  // Find chats by participant
  findByParticipant(userId) {
    return new Promise((resolve, reject) => {
      db.find({ participants: userId }, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },
  
  // Update a chat
  update(id, update) {
    update.updatedAt = new Date();
    
    return new Promise((resolve, reject) => {
      db.update({ _id: id }, { $set: update }, {}, (err, numReplaced) => {
        if (err) return reject(err);
        if (numReplaced === 0) return reject(new Error('Chat not found'));
        Chat.findById(id).then(resolve).catch(reject);
      });
    });
  },
  
  // Add a message to a chat
  addMessage(chatId, message) {
    return new Promise((resolve, reject) => {
      db.update(
        { _id: chatId },
        { 
          $push: { messages: message },
          $set: { 
            lastActivity: new Date(),
            updatedAt: new Date()
          }
        },
        {},
        (err, numReplaced) => {
          if (err) return reject(err);
          if (numReplaced === 0) return reject(new Error('Chat not found'));
          Chat.findById(chatId).then(resolve).catch(reject);
        }
      );
    });
  },
  
  // Delete a chat
  delete(id) {
    return new Promise((resolve, reject) => {
      db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved > 0);
      });
    });
  },
  
  // Remove a specific message from a chat
  removeMessage(chatId, messageId) {
    return new Promise((resolve, reject) => {
      db.update(
        { _id: chatId },
        { $pull: { messages: { _id: messageId } } },
        {},
        (err, numReplaced) => {
          if (err) return reject(err);
          if (numReplaced === 0) return reject(new Error('Chat not found'));
          Chat.findById(chatId).then(resolve).catch(reject);
        }
      );
    });
  }
};

module.exports = Chat; 