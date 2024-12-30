// netlify/functions/utils/db.js
const mongoose = require("mongoose");
let conn = null;

const connectDB = async () => {
    if (conn == null) {
        conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        return conn;
    }
    return conn;
};

module.exports = connectDB;
