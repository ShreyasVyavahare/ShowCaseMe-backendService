// netlify/functions/auth.js
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const connectDB = require("./utils/db");

// Define User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true }
});

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model("User", UserSchema);

// Verify token middleware function
const verifyToken = (authHeader) => {
    if (!authHeader) {
        throw new Error("No token provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    return jwt.verify(token, process.env.JWT_SECRET);
};

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    if (!mongoose.connection.readyState) {
        await connectDB();
    }
    
    try {
  
        
        const path = event.path.replace("/.netlify/functions/auth/", "");
        const method = event.httpMethod;

        // Signup Route
        if (method === "POST" && path === "signup") {
            const { username, email, password } = JSON.parse(event.body);
            const user = new User({ username, email, password });
            await user.save();
            
            return {
                statusCode: 201,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({ message: "User registered successfully" })
            };
        }

        // Login Route
        if (method === "POST" && path === "login") {
            const { email, password } = JSON.parse(event.body);
            // const user = await User.findOne({ email });
            const user = await User.findOne({ email }).select('email username password');
            
            if (!user) {
                return {
                    statusCode: 404,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: JSON.stringify({ message: "User not found" })
                };
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return {
                    statusCode: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: JSON.stringify({ message: "Invalid credentials" })
                };
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            
            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    token,
                    user: { id: user._id, username: user.username, email: user.email }
                })
            };
        }

        // Verify Token Route
        if (method === "GET" && path === "verify") {
            const decoded = verifyToken(event.headers.authorization);
            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(decoded)
            };
        }

        // Get User Route
        if (method === "GET" && path === "user") {
            const decoded = verifyToken(event.headers.authorization);
            const user = await User.findById(decoded.id).select("-password");
            
            if (!user) {
                return {
                    statusCode: 404,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: JSON.stringify({ message: "User not found" })
                };
            }

            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({ username: user.username, email: user.email })
            };
        }

        // Handle OPTIONS request for CORS
        if (method === "OPTIONS") {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
                },
                body: ""
            };
        }

        return {
            statusCode: 404,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ message: "Route not found" })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
