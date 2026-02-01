const express = require('express');
const router = express.Router();
const contactController = require('../controllers/ContactController');

// Submit contact form
router.post('/submit', contactController.submitContact);

// Get all messages (admin)
router.get('/', contactController.getAllMessages);

// Get message by ID
router.get('/:id', contactController.getMessageById);

// Update message status
router.put('/:id/status', contactController.updateMessageStatus);

// Delete message
router.delete('/:id', contactController.deleteMessage);

// Get statistics
router.get('/stats/summary', contactController.getStatistics);

module.exports = router;
