const Datastore = require('nedb');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a new NeDB datastore for users
const db = new Datastore({
  filename: path.join(dataDir, 'users.db'),
  autoload: true
});

// Create indexes
db.ensureIndex({ fieldName: 'username', unique: true }, (err) => {
  if (err) console.error('Error creating index:', err);
});

// User model functions
const User = {
  // Expose the database for direct operations
  db,
  
  // Create a new user
  async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const user = {
      ...userData,
      password: hashedPassword,
      isAdmin: userData.isAdmin || false,
      displayName: userData.displayName || userData.username,
      publicKey: userData.publicKey || '',
      publicKeyVersion: userData.publicKeyVersion || 0,
      privateKey: userData.privateKey || '',
      settings: userData.settings || { darkMode: false },
      blockedUsers: userData.blockedUsers || [],
      profilePic: userData.profilePic || '',
      lastSeen: userData.lastSeen || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return new Promise((resolve, reject) => {
      db.insert(user, (err, newDoc) => {
        if (err) return reject(err);
        resolve(newDoc);
      });
    });
  },
  
  // Find a user by ID
  findById(id) {
    console.log('Finding user by ID:', id);
    return new Promise((resolve, reject) => {
      // In NeDB, we need to query by _id directly
      db.findOne({ _id: id }, (err, doc) => {
        if (err) {
          console.error('Error finding user by ID:', err);
          return reject(err);
        }
        console.log('User found by ID:', id, doc ? 'Yes' : 'No');
        resolve(doc);
      });
    });
  },
  
  // Find a user by username (case-insensitive)
  findByUsername(username) {
    console.log('Finding user by username (case-insensitive):', username);
    return new Promise((resolve, reject) => {
      // Use case-insensitive regex for NeDB
      const query = { username: new RegExp('^' + username + '$', 'i') };
      db.findOne(query, (err, doc) => {
        if (err) {
          console.error('Error finding user by username:', err);
          return reject(err);
        }
        console.log('User found by username:', doc ? 'Yes' : 'No');
        resolve(doc);
      });
    });
  },
  
  // Find a user by username (original method)
  findOne(query) {
    console.log('Finding user with query:', JSON.stringify(query));
    return new Promise((resolve, reject) => {
      db.findOne(query, (err, doc) => {
        if (err) {
          console.error('Error finding user:', err);
          return reject(err);
        }
        console.log('User found:', doc ? 'Yes' : 'No');
        resolve(doc);
      });
    });
  },
  
  // Update a user
  async update(id, update) {
    console.log('Updating user:', id, 'with data:', JSON.stringify(update));
    
    // If password is being updated, hash it
    if (update.password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
    }
    
    update.updatedAt = new Date();
    
    return new Promise((resolve, reject) => {
      db.update({ _id: id }, { $set: update }, {}, (err, numReplaced) => {
        if (err) {
          console.error('Error updating user:', err);
          return reject(err);
        }
        console.log('Number of documents replaced:', numReplaced);
        if (numReplaced === 0) return reject(new Error('User not found'));
        User.findById(id).then(resolve).catch(reject);
      });
    });
  },
  
  // Compare password for login
  async comparePassword(user, candidatePassword) {
    return await bcrypt.compare(candidatePassword, user.password);
  },
  
  // Find all users
  findAll() {
    return new Promise((resolve, reject) => {
      db.find({}, (err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      });
    });
  }
};

module.exports = User; 