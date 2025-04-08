
// netlify/functions/portfolio.js
const mongoose = require("mongoose");
const connectDB = require("./utils/db");
const jwt = require("jsonwebtoken");

const PortfolioSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    personalDetails: { type: Object, required: true },
    skills: [String],
    experience: [Object],
    projects: [Object],
    education: [Object],
    certifications: [Object],
    description: { type: String },
    softSkills: [String],
    languages: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Portfolio = mongoose.model("Portfolio", PortfolioSchema);

// Define User Schema (for username lookup)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
       

        const path = event.path.replace("/.netlify/functions/portfolio/", "");
        const method = event.httpMethod;

        // Create/Update Portfolio Route
        if (method === "POST" && !path) {
            const decoded = verifyToken(event.headers.authorization);
            const { personalDetails, skills, experience, projects, education, certifications, description, softSkills, languages } = JSON.parse(event.body);

            let portfolio = await Portfolio.findOne({ user: decoded.id });
            if (portfolio) {
                portfolio = await Portfolio.findOneAndUpdate(
                    { user: decoded.id },
                    { 
                        personalDetails, 
                        skills, 
                        experience, 
                        projects, 
                        education, 
                        certifications, 
                        description,
                        softSkills,
                        languages,
                        updatedAt: Date.now()
                    },
                    { new: true }
                );
            } else {
                portfolio = new Portfolio({
                    user: decoded.id,
                    personalDetails,
                    skills,
                    experience,
                    projects,
                    education,
                    certifications,
                    description,
                    softSkills,
                    languages
                });
                await portfolio.save();
            }

            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(portfolio)
            };
        }

        // Get Portfolio by Auth User Route
        if (method === "GET" && !path) {
            const decoded = verifyToken(event.headers.authorization);
            const portfolio = await Portfolio.findOne({ user: decoded.id });

            if (!portfolio) {
                return {
                    statusCode: 404,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: JSON.stringify({ message: "Portfolio not found" })
                };
            }

            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(portfolio)
            };
        }

        // Get Portfolio by Username Route
        if (method === "GET" && path) {
            const username = path;
            const user = await User.findOne({ username });
            
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

            const portfolio = await Portfolio.findOne({ user: user._id });
            
            if (!portfolio) {
                return {
                    statusCode: 404,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: JSON.stringify({ message: "Portfolio not found" })
                };
            }

            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(portfolio)
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