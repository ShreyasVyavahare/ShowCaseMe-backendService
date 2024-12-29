const express = require("express");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create or Update Portfolio
router.post("/", authMiddleware, async (req, res) => {
    const {
        personalDetails,
        skills,
        experience,
        projects,
        education,
        certifications,
        description,
        softSkills,
        languages,
    } = req.body;

    if (!personalDetails) {
        return res.status(400).json({ message: "Personal details are required" });
    }

    try {
        let portfolio = await Portfolio.findOne({ user: req.user.id });

        if (portfolio) {
            // Update portfolio
            portfolio = await Portfolio.findOneAndUpdate(
                { user: req.user.id },
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
                    updatedAt: Date.now(),
                },
                { new: true }
            );
            return res.json(portfolio);
        }

        // Create new portfolio
        portfolio = new Portfolio({
            user: req.user.id,
            personalDetails,
            skills,
            experience,
            projects,
            education,
            certifications,
            description,
            softSkills,
            languages,
        });

        await portfolio.save();
        res.json(portfolio);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Get Authenticated User's Portfolio
router.get("/", authMiddleware, async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ user: req.user.id });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }
        res.json(portfolio);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Get Portfolio by Username
router.get("/:username", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const portfolio = await Portfolio.findOne({ user: user._id });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        res.json(portfolio);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
