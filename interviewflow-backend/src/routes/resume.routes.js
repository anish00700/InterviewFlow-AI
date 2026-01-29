const express = require('express');
const router = express.Router();
const { analyzeResume, analyzeResumeATS } = require('../controllers/resume.controller');

// Public endpoints: we do not store the resume, only analyze it in-memory
router.post('/analyze', analyzeResume);
router.post('/ats', analyzeResumeATS);

module.exports = router;

