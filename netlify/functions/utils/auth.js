// netlify/functions/auth.js
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const connectDB = require("./utils/db");

// Define User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", UserSchema);

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    
    try {
        await connectDB();
        
        const path = event.path.replace("/.netlify/functions/auth/", "");
        const method = event.httpMethod;

        if (method === "POST" && path === "signup") {
            const { username, email, password } = JSON.parse(event.body);
            const user = new User({ username, email, password });
            await user.save();
            
            return {
                statusCode: 201,
                body: JSON.stringify({ message: "User registered successfully" })
            };
        }

        if (method === "POST" && path === "login") {
            const { email, password } = JSON.parse(event.body);
            // const user = await User.findOne({ email });
            const user = await User.findOne({ email }).select('email username password');
            
            if (!user) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: "User not found" })
                };
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Invalid credentials" })
                };
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    token,
                    user: { id: user._id, username: user.username, email: user.email }
                })
            };
        }

        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Route not found" })
        };
    } 
    catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};