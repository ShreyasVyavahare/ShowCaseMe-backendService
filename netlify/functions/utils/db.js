// netlify/functions/utils/db.js
const mongoose = require("mongoose");

let cachedDb = null;

const connectDB = async () => {
    if (cachedDb) {
        return cachedDb;
    }

    const db = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000
    });

    cachedDb = db;
    return db;
};

module.exports = connectDB;