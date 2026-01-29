const express = require('express');
const router = express.Router();
const { startInterview, submitAnswer, getInterviewHistory, completeInterview } = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/start', startInterview);
router.post('/answer', submitAnswer);

// Interview history for logged-in user
router.get('/history', protect, getInterviewHistory);

// Complete interview and generate final report
router.post('/:id/complete', protect, completeInterview);

module.exports = router;
