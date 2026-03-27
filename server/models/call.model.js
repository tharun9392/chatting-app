const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a new NeDB datastore for calls
const db = new Datastore({
  filename: path.join(dataDir, 'calls.db'),
  autoload: true
});

// Create indexes for performance
db.ensureIndex({ fieldName: 'callerId' });
db.ensureIndex({ fieldName: 'receiverId' });
db.ensureIndex({ fieldName: 'chatId' });

const Call = {
  db,
  
  create(callData) {
    const call = {
      ...callData,
      status: callData.status || 'initiated', // initiated, joined, missed, rejected, completed
      duration: callData.duration || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return new Promise((resolve, reject) => {
      db.insert(call, (err, newDoc) => {
        if (err) return reject(err);
        resolve(newDoc);
      });
    });
  },
  
  findById(id) {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });
  },
  
  // Find all calls where user is either caller or receiver
  findByUser(userId) {
    return new Promise((resolve, reject) => {
      db.find({ 
        $or: [{ callerId: userId }, { receiverId: userId }] 
      })
      .sort({ createdAt: -1 })
      .exec((err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  },
  
  update(id, update) {
    update.updatedAt = new Date();
    
    return new Promise((resolve, reject) => {
      db.update({ _id: id }, { $set: update }, {}, (err, numReplaced) => {
        if (err) return reject(err);
        if (numReplaced === 0) return reject(new Error('Call not found'));
        Call.findById(id).then(resolve).catch(reject);
      });
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) return reject(err);
        resolve(numRemoved > 0);
      });
    });
  }
};

module.exports = Call;
