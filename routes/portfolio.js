const express = require("express");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { multerUpload, uploadToS3 } = require("../middleware/s3Upload");
const { multerUploadpdf , uploadpdfToS3} = require("../middleware/s3pdfUpload");

const router = express.Router();


// portfolioRoute.js
router.post('/upload', authMiddleware, multerUpload.fields([
  { name: 'profileImageURL', maxCount: 1 },
  { name: 'projectImages', maxCount: 5 }
]), async (req, res) => {
  try {
    // Find the user's portfolio
    let portfolio = await Portfolio.findOne({ user: req.user.id });

    // If no portfolio exists, create a new one
    if (!portfolio) {
      portfolio = new Portfolio({
        user: req.user.id,
        personalDetails: {}, // Initialize personalDetails
        projects: [] // Initialize projects array
      });
    }

    // Ensure personalDetails is initialized
    portfolio.personalDetails = portfolio.personalDetails || {};

    // Process profile image
    if (req.files?.profileImageURL) {
      const file = req.files.profileImageURL[0];
      const profileImageURL = await uploadToS3(file, 'profiles');
      portfolio.personalDetails.profileImageURL = profileImageURL; // Set or replace profileImageURL
    }

    // Process project images
    if (req.files?.projectImages) {
      const projectIndex = parseInt(req.body.projectIndex);
      const file = req.files.projectImages[0];
      const projectImageUrl = await uploadToS3(file, 'projects');

      if (!portfolio.projects) {
        portfolio.projects = [];
      }

      if (!isNaN(projectIndex) && projectIndex >= 0 && projectIndex < portfolio.projects.length) {
        portfolio.projects[projectIndex].projectImage = projectImageUrl;
      } else {
        return res.status(400).json({
          error: 'Invalid project index. Cannot add new project via image upload.'
        });
      }
    }

    // Save the portfolio (create or update)
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { user: req.user.id },
      portfolio,
      { new: true, upsert: true } // upsert: true creates a new document if none exists
    );

    res.json(updatedPortfolio);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.post('/upload-resume', authMiddleware, multerUploadpdf.single('resume'), async (req, res) => {
  try {
    console.log('File:', req.file);

    // Find the user's portfolio
    let portfolio = await Portfolio.findOne({ user: req.user.id });

    // If no portfolio exists, create a new one
    if (!portfolio) {
      portfolio = new Portfolio({
        user: req.user.id,
        personalDetails: {}, // Initialize personalDetails
        projects: [] // Initialize projects array
      });
    }

    // Process the uploaded resume file
    if (req.file) {
      const file = req.file;
      const resumeURL = await uploadpdfToS3(file, 'resumes'); // Upload to S3 in the 'resumes' folder

      // Ensure personalDetails is initialized
      portfolio.personalDetails = portfolio.personalDetails || {};
      portfolio.personalDetails.resumeDriveLink = resumeURL; // Set or replace the resume link
    } else {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    // Save the portfolio (create or update)
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { user: req.user.id },
      { 
        $set: { 
          'personalDetails.resumeDriveLink': portfolio.personalDetails.resumeDriveLink 
        } 
      },
      { new: true, upsert: true } // upsert: true creates a new document if none exists
    );

    res.json(updatedPortfolio);
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.post('/', authMiddleware, async (req, res) => {
    try {
      
      const currentPortfolio = await Portfolio.findOne({ user: req.user.id }) || {};
      

      //   user: req.user.id,
      //   ...req.body,
      //   personalDetails: {
      //     ...JSON.parse(req.body.personalDetails),
      //     // Keep existing profile image if not being updated
      //     profileImageURL: currentPortfolio.personalDetails?.profileImageURL
      //   },
      //   projects: JSON.parse(req.body.projects).map((project, index) => ({
      //     ...project,
      //     // Keep existing project image if not being updated
      //     projectImage: currentPortfolio.projects?.[index]?.projectImage || project.projectImage
      //   })),
      //   skills: JSON.parse(req.body.skills),
      //   experience: JSON.parse(req.body.experience),
      //   education: JSON.parse(req.body.education),
      //   certifications: JSON.parse(req.body.certifications),
      //   softSkills: JSON.parse(req.body.softSkills),
      //   languages: JSON.parse(req.body.languages)
      // };
  
      const portfolioData = {
        user: req.user.id,
        ...req.body,
        personalDetails: {
            ...req.body.personalDetails, // No need to parse
            profileImageURL: currentPortfolio.personalDetails?.profileImageURL
        },
        projects: req.body.projects.map((project, index) => ({
            ...project,
            projectImage: currentPortfolio.projects?.[index]?.projectImage || project.projectImage
        })),
        skills: req.body.skills,
        experience: req.body.experience,
        education: req.body.education,
        certifications: req.body.certifications,
        softSkills: req.body.softSkills,
        languages: req.body.languages
    };
      const portfolio = await Portfolio.findOneAndUpdate(
        { user: req.user.id },
        portfolioData,
        { new: true, upsert: true }
      );
  
      res.json(portfolio);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });






// Get Portfolio by User ID
router.get("/", authMiddleware, async (req, res) => {
  try {
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
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const portfolio = await Portfolio.findOne({ user: user._id });
    if (!portfolio) return res.status(404).json({ message: "Portfolio not found" });

    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;