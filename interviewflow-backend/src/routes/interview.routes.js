const express = require('express');
const router = express.Router();
const { startInterview, submitAnswer, getInterviewHistory, completeInterview, getReportByInterviewId } = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/start', protect, startInterview);
router.post('/answer', protect, submitAnswer);

// Interview history for logged-in user
router.get('/history', protect, getInterviewHistory);

// Get report and history for an interview (view report by id)
router.get('/:id/report', protect, getReportByInterviewId);

// Complete interview and generate final report
router.post('/:id/complete', protect, completeInterview);

module.exports = router;
