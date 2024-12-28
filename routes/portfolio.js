const express = require("express");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User"); // Import the User model
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Save or Update Portfolio
router.post("/", authMiddleware, async (req, res) => {
    const { personalDetails, skills, experience, projects, education, certifications, description ,softSkills ,languages} = req.body;

    try {
        let portfolio = await Portfolio.findOne({ user: req.user.id });
        if (portfolio) {
            // Update portfolio
            portfolio = await Portfolio.findOneAndUpdate(
                { user: req.user.id },
                { personalDetails, skills, experience, projects, education, certifications, description ,softSkills ,languages },
                { new: true }
            );
            return res.json(portfolio);
        }

        // Create portfolio
        portfolio = new Portfolio({
            user: req.user.id,
            personalDetails,
            skills,
            experience,
            projects,
            education,
            certifications,
            description,
        });

        await portfolio.save();
        res.json(portfolio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Portfolio by User ID
router.get("/", authMiddleware, async (req, res) => {
    try {
        // Find portfolio associated with the authenticated user
        const portfolio = await Portfolio.findOne({ user: req.user.id });
        if (!portfolio) return res.status(404).json({ message: "Portfolio not found" });

        res.json(portfolio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Portfolio by Username
router.get("/:username", async (req, res) => {
    try {
        // Find user by username
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Find portfolio associated with the user
        const portfolio = await Portfolio.findOne({ user: user._id });
        if (!portfolio) return res.status(404).json({ message: "Portfolio not found" });

        res.json(portfolio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;