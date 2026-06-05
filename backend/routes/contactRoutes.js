const express = require('express');
const router = express.Router();

// Import controller
const contactController = require('../controllers/contactController');

// =============================================
// VERIFY IMPORTS
// =============================================
console.log('Contact Controller Functions:', {
  submitContact: typeof contactController.submitContact
});

// =============================================
// ROUTES
// =============================================
router.post('/', contactController.submitContact);

module.exports = router;