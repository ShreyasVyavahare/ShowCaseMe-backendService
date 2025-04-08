const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    personalDetails: { type: Object, required: true },
    skills: [String],
    experience: [Object],
    projects: [Object],
    education: [Object],
    certifications: [Object],
    description: { type: String },
    softSkills: [String],
    languages: [String],
    templateId: { type: String, default: null }, 
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);