const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');

// Route to get problem details by slug
router.get('/:titleSlug', problemController.getProblemDetails);

// Route to validate if a problem exists
router.get('/validate/:titleSlug', problemController.validateProblem);

module.exports = router; 