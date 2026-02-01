const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/NewsletterController');

// Get all subscribers
router.get('/', newsletterController.getAllSubscribers);

// Get subscriber by email
router.get('/:email', newsletterController.getSubscriberByEmail);

// Subscribe to newsletter
router.post('/subscribe', newsletterController.subscribe);

// Confirm subscription
router.post('/confirm', newsletterController.confirmSubscription);

// Unsubscribe from newsletter
router.post('/unsubscribe', newsletterController.unsubscribe);

// Get statistics
router.get('/stats/summary', newsletterController.getStatistics);

module.exports = router;
