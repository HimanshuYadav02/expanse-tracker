const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/expense_tracker';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    isMongoConnected = false;
    console.log(`[Database] Notice: Standalone MongoDB service not found locally.`);
    console.log(`[Database] Falling back to embedded persistent storage engine (Zero setup required).`);
    console.log(`[Database] To connect to MongoDB Atlas, add your MONGO_URI in server/.env`);
  }
};

module.exports = {
  connectDB,
  getIsMongoConnected: () => isMongoConnected
};
